import EventEmitter from 'eventemitter3';
import { noop, pick } from 'lodash-es';
import { onValue, orderByChild, push, query, ref, set, update } from 'firebase/database';
import { doc, updateDoc } from 'firebase/firestore';
import BaseStruct from './base';
import firebaseClient from '../firebase';
import type ChannelManager from '../managers/channels';
import Message from './message';

export default class Channel extends BaseStruct implements ChannelData {
  id: string;

  name: string;

  image?: string;

  description?: string;

  participants: Record<string, boolean>;

  pins: string[];

  createdAt: Date;

  voice: ChannelVoiceData;

  isDM: boolean;

  owner?: string | undefined;

  messages: Message[] = [];

  previewMessage: ChannelMessageData | null = null;

  bans: Record<string, boolean>;

  private messagesUnsubscriber = noop;

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
    this.voice = data.voice;
    this.isDM = data.isDM;
    this.owner = data.owner;
    this.bans = data.bans;

    this.manager = manager;
  }

  listenMessages() {
    const messagesQuery = query(ref(firebaseClient.rtdb, `channels/${this.id}/messages`), orderByChild('createdAt'));

    this.messagesUnsubscriber = onValue(messagesQuery, (snap) => {
      const data = snap.val() as ChannelMessageData;

      // Edit
      if (this.messages.some((m) => m.id === data.id)) {
        const message = this.messages.find((m) => m.id === data.id);

        if (message) {
          message.set(data);
          this.events.emit('message', message);
        }

        return;
      }

      console.log(data);
    });

    // onRemo
  }

  stopListenMessages() {
    this.messagesUnsubscriber();
  }

  clean() {
    this.messages.length = 0;
  }

  set(data: ChannelData) {
    this.id = data.id;
    this.name = data.name;
    this.image = data.image;
    this.description = data.description;
    this.participants = data.participants;
    this.pins = data.pins;
    this.createdAt = data.createdAt;
    this.voice = data.voice;
    this.isDM = data.isDM;
    this.owner = data.owner;
  }

  async postMessage(content: string, attachments?: File[]) {
    const id = push(ref(firebaseClient.rtdb, `channels/${this.id}/messages`)).key;
    if (!id || !firebaseClient.auth.currentUser) return;

    const data: ChannelMessageData = {
      id,
      content,
      author: firebaseClient.auth.currentUser.uid,
      createdAt: new Date(),
      attachments: []
    };

    if (attachments && attachments.length > 0) {
      data.attachments = await Promise.all(attachments.map(async (attach) => {
        const path = `attachments/${this.id}/${id}/${attach.name}`;
        await firebaseClient.uploadFile(path, attach);

        const url = await firebaseClient.getFileUrl(path);

        return {
          name: attach.name,
          url,
          type: attach.type,
          createdAt: new Date()
        };
      }));
    }

    const dataRef = ref(firebaseClient.rtdb, `channels/${this.id}/messages/${id}`);
    await set(dataRef, data);

    const message = new Message(data, this);

    return message;
  }

  addParticipant(id: string) {
    if (this.isDM) return;

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

  async commit() {
    const docRef = doc(firebaseClient.firestore, 'channels', this.id);
    const participantsRef = ref(firebaseClient.rtdb, `channels/${this.id}/participants`);

    await Promise.all([
      update(participantsRef, this.participants),
      updateDoc(docRef, pick<ChannelData>(this, [
        'id',
        'name',
        'image',
        'description',
        'participants',
        'pins',
        'createdAt',
        'voice',
        'isDM',
        'owner',
        'bans'
      ]))
    ]);
  }

  copy() {
    return new Channel(this, this.manager);
  }
}