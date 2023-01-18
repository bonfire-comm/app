import Meta from '@/components/Meta';
import Protected from '@/components/Protected';
import firebaseClient from '@/lib/firebase';
import useUser from '@/lib/store/user';
import { Button } from '@mantine/core';
import Image from 'next/image';
import { shallow } from 'zustand/shallow';

export default function App() {
  const [name, photo] = useUser((s) => [s.displayName, s.photoURL], shallow);

  return (
    <Protected fallback={<Meta page="Dashboard" />}>
      <Meta page={`${name}'s homepage`} />

      <Image src={photo ?? ''} alt="cool" width={64} height={64} className="mb-3 rounded-full" />

      <Button onClick={() => firebaseClient.signOut()}>Logout</Button>
    </Protected>
  );
}