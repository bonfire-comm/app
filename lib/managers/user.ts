import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, limit, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { get, onChildChanged, ref, set } from 'firebase/database';
import { noop } from 'lodash-es';
import EventMap from '../classes/eventsMap';
import User from '../classes/user';
import type { Firebase } from '../firebase';
import useUser from '../store/user';
import generateAvatar from '../helpers/generateAvatar';

export default class UserManager {
  readonly cache = new EventMap<string, User>();

  readonly client: Firebase;

  constructor(client: Firebase) {
    this.client = client;

    this.listenToUpdates();
  }

  protected listenToUpdates() {
    let unsubStatuses = noop;
    let unsubUser = noop;

    const unsubUserState = useUser.subscribe((user, prev) => {
      if (!user || user.id === prev?.id) return;

      unsubStatuses();
      unsubUser();

      unsubStatuses = onChildChanged(ref(this.client.rtdb, 'statuses'), async (snapshot) => {
        const id = snapshot.key;
        const data: UserStatus | null = snapshot.val();
        if (!data || !id) return;

        const u = this.cache.get(id);
        if (!u) return;

        u.setStatus(data);
      });

      unsubUser = onSnapshot(collection(this.client.firestore, 'users'), (snapshot) => {
        snapshot.docChanges().forEach(async (changes) => {
          switch (changes.type) {
            case 'modified': {
              const data = changes.doc.data() as UserData;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.createdAt = (data as any).createdAt.toDate();
              const cached = this.cache.get(data.id);

              if (cached) {
                cached.set(data);
                this.cache.events.emit('changed', data.id, cached);
              }

              break;
            }

            default: break;
          }
        });
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
      unsubUserState();

      this.cache.events.off('changed', userChangeHandler);
    };
  }

  async addBuddy(name: string, discriminator: number) {
    if (!this.client.auth.currentUser) {
      throw new Error('not-logged-in');
    }

    const currentUser = useUser.getState();
    if (!currentUser) {
      throw new Error('not-logged-in');
    }

    if (name === currentUser.name && discriminator === currentUser.discriminator) {
      throw new Error('self');
    }

    const profile = await getDocs(query(collection(this.client.firestore, 'users'), where('name', '==', name), where('discriminator', '==', discriminator), limit(1)));
    if (profile.empty) {
      throw new Error('not-found');
    }

    const profileData = profile.docs[0].data() as UserData;
    const docRef = doc(this.client.firestore, 'buddies', profileData.id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return false;

    const data = snap.data() as UserBuddies;

    if (data.blocked.includes(this.client.auth.currentUser.uid)) {
      throw new Error('blocked');
    }

    if (data.added.includes(this.client.auth.currentUser.uid)) {
      throw new Error('already-added');
    }

    if (data.pending.includes(this.client.auth.currentUser.uid)) {
      throw new Error('already-pending');
    }

    await updateDoc(docRef, {
      pending: arrayUnion(this.client.auth.currentUser.uid),
    });

    return true;
  }

  async acceptBuddy(id: string) {
    if (!this.client.auth.currentUser) {
      throw new Error('not-logged-in');
    }

    const { uid } = this.client.auth.currentUser;

    const docRef = doc(this.client.firestore, 'buddies', uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error('internal-error');
    };

    const data = snap.data() as UserBuddies;

    if (data.blocked.includes(id)) {
      throw new Error('blocked');
    }

    if (!data.pending.includes(id)) {
      throw new Error('not-pending');
    }

    await Promise.all([
      updateDoc(docRef, {
        added: arrayUnion(id),
        pending: arrayRemove(id)
      }),
      // Other user
      updateDoc(doc(this.client.firestore, 'buddies', id), {
        added: arrayUnion(uid)
      }),
      this.client.managers.channels.createDM(id)
    ]);

    return true;
  }

  /**
   * Also removes pending request
   * @param id User id
   */
  async removeBuddy(id: string) {
    if (!this.client.auth.currentUser) {
      throw new Error('not-logged-in');
    }

    const { uid } = this.client.auth.currentUser;

    const docRef = doc(this.client.firestore, 'buddies', uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error('internal-error');
    };

    const data = snap.data() as UserBuddies;

    if (data.blocked.includes(id)) {
      throw new Error('blocked');
    }

    await Promise.all([
      updateDoc(docRef, {
        added: arrayRemove(id),
        pending: arrayRemove(id)
      }),
      // Other user
      updateDoc(doc(this.client.firestore, 'buddies', id), {
        added: arrayRemove(uid),
        pending: arrayRemove(uid),
      }),
    ]);

    return true;
  }

  async blockBuddy(id: string) {
    if (!this.client.auth.currentUser) {
      throw new Error('not-logged-in');
    }

    const { uid } = this.client.auth.currentUser;

    const docRef = doc(this.client.firestore, 'buddies', uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error('internal-error');
    }

    const data = snap.data() as UserBuddies;

    if (data.blocked.includes(id)) {
      return true;
    }

    await Promise.all([
      updateDoc(docRef, {
        added: arrayRemove(id),
        pending: arrayRemove(id),
        blocked: arrayUnion(id)
      }),
      // Other user
      updateDoc(doc(this.client.firestore, 'buddies', id), {
        added: arrayRemove(uid),
        pending: arrayRemove(uid),
      }),
    ]);

    return true;
  }

  async unblockBuddy(id: string) {
    if (!this.client.auth.currentUser) {
      throw new Error('not-logged-in');
    }

    const { uid } = this.client.auth.currentUser;

    const docRef = doc(this.client.firestore, 'buddies', uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error('internal-error');
    }

    const data = snap.data() as UserBuddies;

    if (!data.blocked.includes(id)) {
      return true;
    }

    await updateDoc(docRef, {
      blocked: arrayRemove(id)
    });

    return true;
  }

  async fetch(id: string, force = false) {
    if (!force && this.cache.has(id)) {
      return this.cache.get(id);
    }

    const main = (await getDoc(doc(this.client.firestore, 'users', id)).catch(() => null))?.data() as UserData | undefined;
    if (!main) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    main.createdAt = (main as any).createdAt.toDate();

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
      throw new Error('not-logged-in');
    }

    await set(ref(this.client.rtdb, `statuses/${this.client.auth.currentUser.uid}`), status);
  }

  async createNewUser() {
    if (!this.client.auth.currentUser) {
      throw new Error('not-logged-in');
    }

    const user = this.client.auth.currentUser;
    const docRef = doc(this.client.firestore, 'users', this.client.auth.currentUser.uid);

    if ((await getDoc(docRef)).exists()) return null;

    const data: UserData = {
      id: this.client.auth.currentUser.uid,
      name: user.displayName,
      image: user.photoURL ?? await generateAvatar(512),
      discriminator: Math.floor(Math.random() * 8999) + 1000,
      banner: null,
      about: null,
      badges: [],
      createdAt: new Date(),
      activity: null,
    };

    await setDoc(docRef, data);
    this.setStatus('offline');

    const buddiesDocRef = doc(this.client.firestore, 'buddies', this.client.auth.currentUser.uid);

    await setDoc(buddiesDocRef, {
      added: [],
      pending: [],
      blocked: [],
    } as UserBuddies);

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
    } else {
      finalData.image = await generateAvatar(512, data.name);
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