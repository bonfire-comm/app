import { create } from 'zustand';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
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

export const fetchBuddies = async () => {
  const user = useUser.getState();
  if (!user) return;

  const data = (await getDoc(doc(firebaseClient.firestore, 'buddies', user.id))).data() as UserBuddies | undefined;
  if (!data) return;

  useBuddies.setState(new Buddies(data), true);
};

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