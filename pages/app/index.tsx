import Meta from '@/components/Meta';
import Protected from '@/components/Protected';
import firebaseClient from '@/lib/firebase';
import useUser from '@/lib/store/user';
import { Button } from '@mantine/core';

export default function App() {
  const name = useUser();

  // TODO: when username is null, redirect onboarding page

  return (
    <Protected>
      <Meta page={`${name}'s homepage`} />

      <Button onClick={() => firebaseClient.signOut()}>Logout</Button>
    </Protected>
  );
}