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
import Router from 'next/router';
import useUser from '../store/user';
import Providers from './authProviders';
import useInternal from '../store';
// eslint-disable-next-line import/no-cycle
import fetcher from '../api/fetcher';

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

  constructor() {
    this.app = initializeApp(this.firebaseConfig);
    this.auth = getAuth(this.app);
    this.storage = getStorage(this.app);

    if (process.env.NODE_ENV === 'development') {
      connectAuthEmulator(this.auth, 'http://localhost:9099');
      connectStorageEmulator(this.storage, 'localhost', 9199);
    }

    this.registerListeners();
  }

  registerListeners() {
    onAuthStateChanged(this.auth, (user) => this.userChanged(user));
  }

  async userChanged(user: User | null) {
    let data = {};

    if (user) {
      const res = await fetcher
        .get<SemanticResponse<UserData>>('/users/me')
        .catch(() => null);

      data = {
        ...user,
        ...res,
      } as User & UserData;
    }

    useUser.setState(data, true);
    useInternal.setState({ userLoaded: true });
  }

  // Auth
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
    await this.auth.signOut();

    if (redirect) {
      Router.push('/login');
    }
  }

  async refetchUser() {
    await this.auth.currentUser?.reload();
    await this.userChanged(this.auth.currentUser);
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

  async uploadProfilePicture(
    file: File | Blob | Uint8Array | ArrayBuffer,
    updateProfile = true
  ) {
    const filename = `${this.auth.currentUser?.uid}-${Date.now()}.webp`;
    await this.uploadFile(`pictures/${filename}`, file);

    const url = `${
      (await this.getFileUrl(`pictures/${filename}`)).split('?')[0]
    }?alt=media`;

    if (updateProfile) {
      await fetcher('/users/me', {
        method: 'POST',
        data: {
          image: url,
        },
      });

      await this.refetchUser();
    }

    return url;
  }
}

const firebaseClient = new Firebase();

export default firebaseClient;
