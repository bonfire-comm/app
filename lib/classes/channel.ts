/* eslint-disable @typescript-eslint/no-non-null-assertion */
import EventEmitter from 'eventemitter3';
import { clone, isEqual, noop } from 'lodash-es';
import { get, limitToLast, onChildAdded, onChildChanged, onChildRemoved, orderByChild, push, query, ref, remove, serverTimestamp, set, update } from 'firebase/database';
import { collection, deleteDoc, doc, getDocs, query as firestoreQuery, setDoc, updateDoc, where, onSnapshot } from 'firebase/firestore';
import randomWords from 'random-words';
import { Meeting } from '@videosdk.live/js-sdk/meeting';
import BaseStruct from './base';
import firebaseClient from '../firebase';
import type ChannelManager from '../managers/channels';
import Message from './message';
import generateId from '../helpers/generateId';
import useBuddies from '../store/buddies';
import fetcher from '../api/fetcher';
import useVoice from '../store/voice';
import useUser from '../store/user';

const MESSAGE_TRESHOLD = 10;
const COOLDOWN_DURATION = 5000;

export default class Channel extends BaseStruct implements ChannelData {
  id: string;

  name: string;

  image?: string;

  description?: string;

  participants: Record<string, boolean>;

  pins: string[];

  createdAt: Date;

  isDM: boolean;

  owner?: string | undefined;

  messages: Message[] = [];

  previewMessage: ChannelMessageData | null = null;

  bans: Record<string, boolean>;

  voiceToken?: string;

  voiceRoom?: RoomData;

  protected timeFetchVoiceToken: Date | null = null;

  private messagesUnsubscriber = noop;

  private lastMessageTime = Date.now();

  private messageCount = 0;

  private onCooldown = false;

  readonly events = new EventEmitter<ChannelEventTypes>();

  readonly manager: ChannelManager;

  constructor(data: ChannelData, manager: ChannelManager) {
    super();

    this.id = data.id;
    this.name = data.name;
    this.image = data.image;
    this.description = data.description;
    this.participants = data.participants;
    this.pins = data.pins;
    this.createdAt = data.createdAt;
    this.isDM = data.isDM;
    this.owner = data.owner;
    this.bans = data.bans;

    this.manager = manager;

    this.listenChanges();
  }

  listenChanges() {
    const unsub = onSnapshot(doc(this.manager.client.firestore, 'channels', this.id), (snap) => {
      const data = snap.data() as ChannelData;

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.createdAt = (data as any).createdAt.toDate() as Date;

        this.set(data);

        this.events.emit('changed', this);
        this.manager.cache.events.emit('changed', this.id, this);
      }
    });

    return unsub;
  }

  listenMessages() {
    const messagesQuery = query(
      ref(firebaseClient.rtdb, `channels/${this.id}/messages`),
      orderByChild('createdAt'),
      limitToLast(50)
    );

    const unsubAdded = onChildAdded(messagesQuery, (snap) => {
      const data = snap.val() as ChannelMessageData;

      // Hot reload dupes
      if (this.messages.some((m) => m.id === data.id)) return;

      // eslint-disable-next-line no-param-reassign
      if (data.createdAt) data.createdAt = new Date(data.createdAt);
      if (data.editedAt) data.editedAt = new Date(data.editedAt);

      // Add
      const messageObj = new Message(data, this);
      this.messages.push(messageObj);
      this.events.emit('message', messageObj);
    });

    const unsubChanged = onChildChanged(messagesQuery, (snap) => {
      const data = snap.val() as ChannelMessageData;

      // eslint-disable-next-line no-param-reassign
      if (data.createdAt) data.createdAt = new Date(data.createdAt);
      if (data.editedAt) data.editedAt = new Date(data.editedAt);

      // Edit
      if (this.messages.some((m) => m.id === data.id)) {
        const cached = this.messages.find((m) => m.id === data.id);

        if (cached && !isEqual(cached.toJSON(), data)) {
          cached.set(data);
          this.messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          this.events.emit(`message-${data.id}`, cached);
        }
      }
    });

    const unsubRemoved = onChildRemoved(messagesQuery, (snap) => {
      const data = snap.val() as ChannelMessageData;

      // Delete
      if (this.messages.some((m) => m.id === data.id)) {
        const cached = this.messages.find((m) => m.id === data.id);

        if (cached) {
          this.messages.splice(this.messages.indexOf(cached), 1);
          this.events.emit('message', cached);
        }
      }
    });

    this.messagesUnsubscriber = () => {
      unsubAdded();
      unsubChanged();
      unsubRemoved();
    };
  }

  stopListenMessages() {
    this.messagesUnsubscriber();
  }

  clean() {
    this.messages.length = 0;
  }

  async fetchVoiceOngoingSession(cancelSignal?: AbortSignal) {
    if (!this.isVoiceTokenValid) await this.getVoiceToken(cancelSignal);

    const ongoing = await fetcher<SemanticResponse<SessionData | null>>('/voice/ongoing', {
      method: 'GET',
      params: {
        channel: this.id,
        token: window.encodeURIComponent(this.voiceToken!),
      },
      signal: cancelSignal
    });

    this.events.emit('voice-session-fetch', ongoing.data.payload ?? null);

    return ongoing.data.payload ?? null;
  }

  async fetchVoiceRoom(cancelSignal?: AbortSignal) {
    if (this.voiceRoom) return this.voiceRoom;
    if (!this.isVoiceTokenValid) await this.getVoiceToken(cancelSignal);

    const validate = await fetcher<SemanticResponse<RoomData>>('/voice/validate', {
      method: 'GET',
      params: {
        channel: this.id,
        token: window.encodeURIComponent(this.voiceToken!),
      },
      signal: cancelSignal
    }).catch(() => null);

    if (validate && validate.data.payload) {
      this.voiceRoom = validate.data.payload;

      this.events.emit('voice-room-fetch', validate.data.payload);

      return validate.data.payload;
    }

    const create = await fetcher<SemanticResponse<RoomData>>('/voice/create', {
      method: 'POST',
      data: {
        channel: this.id,
        token: window.encodeURIComponent(this.voiceToken!),
      },
      signal: cancelSignal
    });

    this.voiceRoom = create.data.payload;

    this.events.emit('voice-room-fetch', create.data.payload);

    return create.data.payload;
  }

  async getVoiceToken(cancelSignal?: AbortSignal) {
    if (this.isVoiceTokenValid) {
      return this.voiceToken;
    }

    const fetched = await fetcher<SemanticResponse<VoiceTokenPayload>>('/voice/token', {
      method: 'GET',
      params: {
        channel: this.id,
      },
      signal: cancelSignal
    }).catch(() => null);

    if (!fetched || !fetched.data.payload) return;

    this.timeFetchVoiceToken = new Date();
    this.voiceToken = fetched.data.payload.token;

    this.events.emit('voice-token', fetched.data.payload);

    const { SDK } = useVoice.getState();
    if (SDK && typeof window !== 'undefined') {
      SDK.config(fetched.data.payload.token);
    }

    return this.voiceToken;
  }

  get isVoiceTokenValid() {
    return this.voiceToken && this.timeFetchVoiceToken && this.timeFetchVoiceToken.getTime() - Date.now() < 6 * 60 * 1000; // 6h
  }

  async startVoice(joinImmediately = false) {
    const { SDK, meeting: currentMeeting, muted } = useVoice.getState();
    const user = useUser.getState();

    if (!SDK || !user || !user.name) return;
    if (!this.voiceToken || !this.isVoiceTokenValid) await this.getVoiceToken();
    if (!this.voiceRoom) await this.fetchVoiceRoom();

    if (currentMeeting) {
      currentMeeting.leave();
    }

    const meeting = SDK.initMeeting({
      meetingId: this.voiceRoom!.roomId,
      name: user.name,
      participantId: user.id,
      micEnabled: !muted,
      webcamEnabled: false,
      token: this.voiceToken as string,
    });

    const speakerChangedHandler = (id: string | null) => {
      useVoice.setState({
        activeTalker: id,
      });
    };

    const connectionCloseHandler = ({ state }: { state: MeetingState }) => {
      if (state === 'CLOSED') {
        useVoice.setState({
          meeting: null
        });

        // @ts-expect-error Undocumentec
        meeting.off('meeting-state-changed', connectionCloseHandler);
        meeting.off('speaker-changed', speakerChangedHandler);
      }
    };

    // @ts-expect-error Undocumentec
    meeting.on('meeting-state-changed', connectionCloseHandler);
    meeting.on('speaker-changed', speakerChangedHandler);

    useVoice.setState({
      activeChannelId: this.id,
      meeting,
      state: 'CONNECTING',
      video: false,
    });

    if (joinImmediately) {
      meeting.join();
    }

    if (localStorage.mic && await Channel.isValidMic(localStorage.mic, meeting)) {
      meeting.changeMic(localStorage.mic);
    }

    if (localStorage.cam && await Channel.isValidCam(localStorage.cam, meeting)) {
      meeting.changeWebcam(localStorage.cam);
    }

    return meeting;
  }

  static async isValidMic(id: string, meeting?: Meeting | null) {
    // eslint-disable-next-line no-param-reassign
    if (!meeting) meeting = useVoice.getState().meeting;
    if (!meeting) return false;

    const mics = await meeting.getMics();
    return mics.some((m) => m.deviceId === id);
  }

  static async isValidCam(id: string, meeting?: Meeting | null) {
    // eslint-disable-next-line no-param-reassign
    if (!meeting) meeting = useVoice.getState().meeting;
    if (!meeting) return false;

    const cams = await meeting.getWebcams();
    return cams.some((m) => m.deviceId === id);
  }

  async leave() {
    if (!firebaseClient.auth.currentUser) return;

    await this.removeParticipant(firebaseClient.auth.currentUser.uid)?.commit();
  }

  set(data: ChannelData) {
    this.id = data.id;
    this.name = data.name;
    this.image = data.image;
    this.description = data.description;
    this.participants = data.participants;
    this.pins = data.pins;
    this.createdAt = data.createdAt;
    this.isDM = data.isDM;
    this.owner = data.owner;
  }

  async getUser() {
    if (!this.isDM) return;

    const uid = Object.keys(this.participants)
      .find((p) => p !== firebaseClient.auth.currentUser?.uid);

    if (!uid) return;

    return firebaseClient.managers.user.fetch(uid);
  }

  async resolveName() {
    if (!this.isDM) return this.name;

    const currentUserId = useUser.getState()?.id;
    if (!currentUserId) return null;

    const [participant] = Object.keys(this.participants).filter((v) => v !== currentUserId);

    const resolved = await firebaseClient.managers.user.fetch(participant);
    return resolved?.name ?? null;
  }

  async postMessage(content: string, { attachments,replyTo }: { attachments?: File[]; replyTo?: string | null }) {
    const id = push(ref(firebaseClient.rtdb, `channels/${this.id}/messages`)).key;
    if (!id || !firebaseClient.auth.currentUser) return;

    if (!this.participants[firebaseClient.auth.currentUser.uid]) {
      throw new Error('not_participant');
    }

    if (this.isDM) {
      const user = await this.getUser();
      if (!user) return;

      const buddies = await user.fetchBuddies(false);
      const ourBuddies = useBuddies.getState();
      if (ourBuddies.blocked.includes(user.id)) {
        throw new Error('you-blocked');
      }

      if (buddies?.blocked.includes(firebaseClient.auth.currentUser.uid)) {
        throw new Error('blocked');
      }
    }

    if (this.onCooldown) {
      throw new Error('cooldown');
    }

    const currentTime = Date.now();

    if (currentTime - this.lastMessageTime < 1000) {
      this.messageCount += 1;
      this.lastMessageTime = currentTime;

      if (this.messageCount >= MESSAGE_TRESHOLD) {
        this.onCooldown = true;

        setTimeout(() => {
          this.onCooldown = false;
          this.messageCount = 0;
        }, COOLDOWN_DURATION);

        throw new Error('cooldown');
      }
    } else {
      this.messageCount = 1;
      this.lastMessageTime = currentTime;
    }

    const data = {
      id,
      content,
      author: firebaseClient.auth.currentUser.uid,
      createdAt: serverTimestamp(),
      attachments: [] as ChannelMessageAttachmentData[],
      replyTo
    };

    if (attachments && attachments.length > 0) {
      const uploaded: ChannelMessageAttachmentData[] = [];

      // eslint-disable-next-line no-restricted-syntax
      for (const attach of [...attachments].sort((a, b) => a.size - b.size)) {
        const attachId = generateId();
        const path = `attachments/${this.id}/${id}/${attachId}-${attach.name}`;
        // eslint-disable-next-line no-await-in-loop
        await firebaseClient.uploadFile(path, attach);

        // eslint-disable-next-line no-await-in-loop
        const url = await firebaseClient.getFileUrl(path);

        uploaded.push({
          name: attach.name,
          url,
          type: attach.type,
          id: attachId
        });
      }

      data.attachments = uploaded;
    }

    const dataRef = ref(firebaseClient.rtdb, `channels/${this.id}/messages/${id}`);
    await set(dataRef, data);

    const serverData = (await get(dataRef)).val();
    serverData.createdAt = new Date(serverData.createdAt);

    const message = new Message(data as ChannelMessageData, this);

    return message;
  }

  addParticipant(id: string) {
    if (this.isDM) return;
    if (this.bans[id]) return;

    this.participants[id] = true;

    return this;
  }

  removeParticipant(id: string) {
    if (this.participants[id] === undefined) return;

    delete this.participants[id];

    return this;
  }

  ban(id: string) {
    this.removeParticipant(id);
    this.bans[id] = true;

    return this;
  }

  unban(id: string) {
    if (this.bans[id] === undefined) return;

    delete this.bans[id];

    return this;
  }

  async fetchMessage(id: string, force = false) {
    if (!force) {
      const cached = this.messages.find((m) => m.id === id);
      if (cached) return cached;
    }

    const snap = await get(ref(firebaseClient.rtdb, `channels/${this.id}/messages/${id}`));

    if (!snap.exists()) return null;

    const data = snap.val() as ChannelMessageData;
    data.createdAt = new Date(data.createdAt);

    return new Message(data, this);
  }

  pinMessage(id: string) {
    this.pins.push(id);

    return this;
  }

  unpinMessage(id: string) {
    const index = this.pins.indexOf(id);
    if (index !== -1) this.pins.splice(index, 1);

    return this;
  }

  async createInvite() {
    if (!firebaseClient.auth.currentUser) return;

    const existings = await getDocs(firestoreQuery(collection(firebaseClient.firestore, 'invites'), where('channelId', '==', this.id), where('createdBy', '==', firebaseClient.auth.currentUser.uid)));
    if (!existings.empty) {
      const first = existings.docs[0].data() as ChannelInviteData;
      return first;
    }

    const phrase = randomWords({ exactly: 5, join: '-' });

    const docRef = doc(firebaseClient.firestore, `invites/${phrase}`);
    const data: ChannelInviteData = {
      id: phrase,
      uses: 0,
      channelId: this.id,
      createdAt: new Date(),
      createdBy: firebaseClient.auth.currentUser.uid
    };

    await setDoc(docRef, data);

    return data;
  }

  async revokeInvite(phrase: string) {
    const docRef = doc(firebaseClient.firestore, `invites/${phrase}`);

    await deleteDoc(docRef);
  }

  async fetchInvites() {
    const q = firestoreQuery(collection(firebaseClient.firestore, 'invites'), where('channelId', '==', this.id));
    const snap = await getDocs(q);

    return snap.docs.map((d) => d.data() as ChannelInviteData);
  }

  async delete() {
    const docRef = doc(firebaseClient.firestore, 'channels', this.id);
    const dataRef = ref(firebaseClient.rtdb, `channels/${this.id}`);

    await Promise.all([
      remove(dataRef),
      deleteDoc(docRef),
    ]);
  }

  async commit() {
    const docRef = doc(firebaseClient.firestore, 'channels', this.id);
    const participantsRef = ref(firebaseClient.rtdb, `channels/${this.id}/participants`);

    await Promise.all([
      update(participantsRef, this.participants),
      updateDoc(docRef, {
        name: this.name,
        image: this.image ?? null,
        description: this.description ?? null,
        participants: this.participants,
        pins: this.pins,
        isDM: this.isDM,
        owner: this.owner ?? null,
        bans: this.bans
      })
    ]);
  }

  copy() {
    return clone(this);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      image: this.image,
      description: this.description,
      participants: this.participants,
      pins: this.pins,
      isDM: this.isDM,
      owner: this.owner,
      bans: this.bans
    };
  }
}