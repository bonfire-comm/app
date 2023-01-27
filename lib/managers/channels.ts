import { collection, doc, getDoc, getDocs, limit, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { noop } from 'lodash-es';
import { ref, set } from 'firebase/database';
import Channel from '../classes/channel';
import EventMap from '../classes/eventsMap';
import firebaseClient, { Firebase } from '../firebase';
import useUser from '../store/user';
import generateId from '../helpers/generateId';

export default class ChannelManager {
  readonly cache = new EventMap<string, Channel>();

  readonly client: Firebase;

  constructor(client: Firebase) {
    this.client = client;

    this.listenToUpdates();
  }

  listenToUpdates() {
    let unsubChannels = noop;

    const unsubUser = useUser.subscribe((user, prev) => {
      if (!user || user.id === prev?.id) return;

      unsubChannels();

      const userChannelsRef = query(collection(this.client.firestore, 'channels'), where(`participants.${user.id}`, '==', true));
      unsubChannels = onSnapshot(userChannelsRef, (snap) => {
        snap.docChanges().forEach((v) => {
          switch (v.type) {
            case 'added': {
              const data = v.doc.data() as ChannelData;

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.createdAt = (data as any).createdAt?.toDate() as Date;

              this.cache.set(data.id, new Channel(data, this));

              break;
            }

            case 'modified': {
              const data = v.doc.data() as ChannelData;
              const channel = this.cache.get(data.id);

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.createdAt = (data as any).createdAt?.toDate() as Date;

              if (channel) {
                channel.set(data);
                this.cache.events.emit('changed', channel.id, channel);
              }

              break;
            }

            default: {
              const data = v.doc.data() as ChannelData;
              this.cache.delete(data.id);

              break;
            }
          }
        });
      });
    });

    return () => {
      unsubChannels();
      unsubUser();
    };
  }

  async fetch(id: string, force = false) {
    if (!force && this.cache.has(id)) {
      return this.cache.get(id);
    }

    const main = (await getDoc(doc(this.client.firestore, 'channels', id)).catch(() => null))?.data() as ChannelData | undefined;
    if (!main) return;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const channel = new Channel(main, this);
    this.cache.set(id, channel);

    return channel;
  }

  async create(data: Omit<ChannelData, 'id'>) {
    const id = generateId();
    const docRef = doc(firebaseClient.firestore, 'channels', id);
    const participantsRef = ref(firebaseClient.rtdb, `channels/${id}/participants`);

    await Promise.all([
      setDoc(docRef, data),
      set(participantsRef, data.participants)
    ]);

    return {
      id,
      ...data
    } as ChannelData;
  }

  async createDM(otherUserId: string) {
    const user = useUser.getState();
    if (!user) return;

    const checkExist = await getDocs(query(
      collection(this.client.firestore, 'channels'),
      where('isDM', '==', true),
      where(`participants.${otherUserId}`, '==', true),
      where(`participants.${user.id}`, '==', true),
      limit(1)
    )).catch(() => null);
    if (checkExist && !checkExist.empty) {
      const data = checkExist.docs[0].data() as ChannelData | undefined;
      if (data) {
        return data.id;
      }

      throw new Error('already-exists');
    };

    const channel = await this.create({
      name: otherUserId,
      participants: {
        [user.id]: true,
        [otherUserId]: true,
      },
      bans: {},
      pins: [],
      createdAt: new Date(),
      voice: {
        started: false,
        participants: []
      },
      isDM: true,
    });

    return channel.id;
  }
}