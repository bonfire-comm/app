import { create } from 'zustand';
import { doc, onSnapshot } from 'firebase/firestore';
import { noop } from 'lodash-es';
import Buddies from '../classes/buddies';
import firebaseClient from '../firebase';
import useUser from './user';

const useBuddies = create<Buddies>(() => new Buddies({
  added: [],
  pending: [],
  blocked: [],
}));

let unsub = noop;

useUser.subscribe((state, prev) => {
  if (!state || state.id === prev?.id) return;

  unsub();

  unsub = onSnapshot(doc(firebaseClient.firestore, 'buddies', state.id), async (snap) => {
    const data = snap.data() as UserBuddies | undefined;
    const buddies = new Buddies(data ?? {
      added: [],
      pending: [],
      blocked: [],
    });

    useBuddies.setState(buddies, true);
  });
});

export default useBuddies;