import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import useUser from '../store/user';
import Providers from './authProviders';
import useInternal from '../store';

export class Firebase {
  readonly firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID
  };

  public app: FirebaseApp;

  public auth: Auth;

  constructor() {
    this.app = initializeApp(this.firebaseConfig);
    this.auth = getAuth(this.app);

    this.registerListeners();
  }

  registerListeners() {
    onAuthStateChanged(this.auth, (user) => {
      useUser.setState(user ?? {}, true);
      useInternal.setState({ userLoaded: true });
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

  signOut() {
    return this.auth.signOut();
  }
}

const firebaseClient = new Firebase();

export default firebaseClient;