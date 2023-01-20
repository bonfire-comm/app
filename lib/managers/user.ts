import { collection, doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { get, onValue, ref, set } from 'firebase/database';
import EventMap from '../classes/eventsMap';
import User from '../classes/user';
import type { Firebase } from '../firebase';
import useUser from '../store/user';

export default class UserManager {
  readonly cache = new EventMap<string, User>();

  readonly client: Firebase;

  constructor(client: Firebase) {
    this.client = client;

    this.listenToUpdates();
  }

  protected listenToUpdates() {
    const unsubStatuses = onValue(ref(this.client.rtdb, 'statuses'), async (snapshot) => {
      const data: Record<string, UserStatus> = snapshot.val();
      Object.entries(data)
        .forEach(([id, status]) => {
          const u = this.cache.get(id);
          if (!u) return;

          u.setStatus(status);
        });
    });

    const unsubUser = onSnapshot(collection(this.client.firestore, 'users'), (snapshot) => {
      snapshot.docChanges().forEach(async (changes) => {
        switch (changes.type) {
          case 'modified': {
            const data = changes.doc.data() as UserData;
            const cached = this.cache.get(data.id);

            if (cached) {
              cached.set(data);
            }

            break;
          }

          default: break;
        }
      });
    });

    const userChangeHandler = (key: string, value: User) => {
      if (key === this.client.auth.currentUser?.uid) {
        useUser.setState(value.copy(), true);
      }
    };

    this.cache.events.on('changed', userChangeHandler);

    return () => {
      unsubStatuses();
      unsubUser();

      this.cache.events.off('changed', userChangeHandler);
    };
  }

  async fetch(id: string, force = false) {
    if (!force && this.cache.has(id)) {
      return this.cache.get(id);
    }

    const main = (await getDoc(doc(this.client.firestore, 'users', id)).catch(() => null))?.data() as UserData | undefined;
    if (!main) return;

    const status = (await get(ref(this.client.rtdb, `statuses/${id}`)).catch(() => null))?.val() as UserStatus | undefined ?? 'offline';

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const user = new User({
      ...main,
      status,
    }, this);
    this.cache.set(id, user);

    return user;
  }

  async getCurrentUser(force = false) {
    if(!this.client.auth.currentUser) return;

    return this.fetch(this.client.auth.currentUser.uid, force);
  }

  /**
   * @param status Current user status
   * @client-only
   */
  async setStatus(status: UserStatus) {
    if (!this.client.auth.currentUser) {
      throw new Error('No user logged in');
    }

    await set(ref(this.client.rtdb, `statuses/${this.client.auth.currentUser.uid}`), status);
  }

  async createNewUser() {
    if (!this.client.auth.currentUser) {
      throw new Error('No user logged in');
    }

    const docRef = doc(this.client.firestore, 'users', this.client.auth.currentUser.uid);

    if ((await getDoc(docRef)).exists()) return null;

    const data: UserData = {
      id: this.client.auth.currentUser.uid,
      name: null,
      image: null,
      discriminator: Math.floor(Math.random() * 8999) + 1000,
      banner: null,
      about: null,
      badges: [],
      createdAt: new Date(),
      activity: null,
    };

    await setDoc(docRef, data);
    this.setStatus('offline');

    const instance = new User({ ...data, status: 'offline' }, this);
    this.client.managers.user.cache.set(data.id, instance);

    return instance;
  }

  async updateUser(data: Partial<Omit<UserData, 'image'> & { image?: File | Blob | null }>) {
    if (!this.client.auth.currentUser) {
      throw new Error('No user logged in');
    }

    const { uid } = this.client.auth.currentUser;
    const finalData = { ...data } as Omit<UserData, 'image'> & { image?: File | Blob | string | null };

    if (data.image) {
      finalData.image = await this.uploadProfilePicture(data.image);
    }

    await updateDoc(doc(this.client.firestore, 'users', uid), {
      ...finalData
    });
  }

  async uploadProfilePicture(
    file: File | Blob | Uint8Array | ArrayBuffer,
  ) {
    if (!this.client.auth.currentUser) {
      throw new Error('No user logged in');
    }

    const { uid } = this.client.auth.currentUser;

    const filename = `${uid}-${Date.now()}.webp`;
    await this.client.uploadFile(`pictures/${filename}`, file);

    const url = `${
      (await this.client.getFileUrl(`pictures/${filename}`)).split('?')[0]
    }?alt=media`;

    return url;
  }
}