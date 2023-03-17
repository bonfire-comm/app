import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app';
import {
  Auth,
  User,
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  verifyPasswordResetCode,
} from 'firebase/auth';
import {
  FirebaseStorage,
  connectStorageEmulator,
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage';
import { Database, connectDatabaseEmulator, getDatabase, onDisconnect, onValue, ref as DBRef, set } from 'firebase/database';
import { Firestore, connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

import Router from 'next/router';
import EventEmitter from 'eventemitter3';
import useUser from '../store/user';
import Providers from './authProviders';
import useInternal from '../store';

import UserManager from '../managers/user';
import CookieSetterBuilder from '../managers/cookie';
import ChannelManager from '../managers/channels';
import { fetchBuddies } from '../store/buddies';

export class Firebase {
  readonly firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
    databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL
  };

  public app: FirebaseApp;

  public auth: Auth;

  public storage: FirebaseStorage;

  public rtdb: Database;

  public firestore: Firestore;

  public managers: {
    user: UserManager;
    channels: ChannelManager;
  };

  private tokenIsGenerating = false;

  readonly events = new EventEmitter();

  constructor() {
    this.app = initializeApp(this.firebaseConfig);

    this.auth = getAuth(this.app);
    this.storage = getStorage(this.app);
    this.rtdb = getDatabase(this.app);
    this.firestore = getFirestore(this.app);

    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATOR && typeof window !== 'undefined') {
      connectAuthEmulator(this.auth, 'http://localhost:9099', {
        disableWarnings: true
      });
      connectStorageEmulator(this.storage, 'localhost', 9199);
      connectDatabaseEmulator(this.rtdb, 'localhost', 9000);
      connectFirestoreEmulator(this.firestore, 'localhost', 8080);
    }

    this.managers = {
      user: new UserManager(this),
      channels: new ChannelManager(this)
    };

    this.registerListeners();
  }

  registerListeners() {
    onAuthStateChanged(this.auth, (user) => this.userChanged(user));

    onValue(DBRef(this.rtdb, '.info/connected'), async (snapshot) => {
      if (snapshot.val() === false) return;

      this.setStatuses();
    });
  }

  async setStatuses() {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return;

    const userStatusRef = DBRef(this.rtdb, `statuses/${uid}`);
    await onDisconnect(userStatusRef).set('offline');
    await set(userStatusRef, 'online');
  }

  async userChanged(user: User | null) {
    if (user) {
      const u = await this.managers.user.fetch(user.uid);
      if (!u) useUser.setState(await this.managers.user.createNewUser(), true);
      else useUser.setState(u.copy(), true);

      await Promise.all([
        this.setStatuses(),
        fetchBuddies()
      ]);

    } else {
      useUser.setState(null, true);
    }

    useInternal.setState({ userLoaded: true });
  }

  // Auth
  async generateToken() {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<void>(async (resolve, reject) => {
      if (this.tokenIsGenerating) {
        // eslint-disable-next-line no-promise-executor-return
        return this.events.once('tokenGenerated', resolve);
      }

      try {
        this.tokenIsGenerating = true;

        const user = this.auth.currentUser;
        const builder = new CookieSetterBuilder();

        builder.remove('token:/');

        if (user) {
          const token = await user.getIdToken();

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          builder.set('token', token, {
            httpOnly: true,
            path: '/'
          });

          useInternal.setState({ token });
        }

        await builder.commit();

        this.tokenIsGenerating = false;

        this.events.emit('tokenGenerated');
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  signInWithEmailAndPassword(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  createUserWithEmailAndPassword(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  signInWithPopup(provider: keyof typeof Providers) {
    return signInWithPopup(this.auth, Providers[provider]);
  }

  sendResetPasswordEmail(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  changePassword(code: string, password: string) {
    return confirmPasswordReset(this.auth, code, password);
  }

  verifyPasswordResetCode(code: string) {
    return verifyPasswordResetCode(this.auth, code);
  }

  verifyEmailVerificationCode(code: string) {
    return checkActionCode(this.auth, code);
  }

  verifyEmail(code: string) {
    return applyActionCode(this.auth, code);
  }

  async signOut(redirect = true) {
    useUser.setState({}, true);

    if (redirect) {
      await Router.push('/login');
    }

    await this.auth.signOut();
  }

  // Storage
  uploadFile(path: string, file: File | Blob | Uint8Array | ArrayBuffer) {
    const ref = storageRef(this.storage, path);

    return uploadBytes(ref, file);
  }

  getFileUrl(path: string) {
    const ref = storageRef(this.storage, path);

    return getDownloadURL(ref);
  }
}

const firebaseClient = new Firebase();

export default firebaseClient;
