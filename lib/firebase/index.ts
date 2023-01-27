import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  Auth,
  User,
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
import useUser from '../store/user';
import Providers from './authProviders';
import useInternal from '../store';

import UserManager from '../managers/user';
import CookieSetterBuilder from '../managers/cookie';
import ChannelManager from '../managers/channels';

export class Firebase {
  readonly firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
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

  constructor() {
    this.app = initializeApp(this.firebaseConfig);

    this.auth = getAuth(this.app);
    this.storage = getStorage(this.app);
    this.rtdb = getDatabase(this.app);
    this.firestore = getFirestore(this.app);

    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
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

      this.setStatuses();
    } else {
      useUser.setState(null, true);
    }

    useInternal.setState({ userLoaded: true });
  }

  // Auth
  async generateToken(user: User | null) {
    if (this.tokenIsGenerating) return;

    this.tokenIsGenerating = true;

    const builder = new CookieSetterBuilder();

    if (!user) {
      builder.remove('token:/');
    } else {
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
