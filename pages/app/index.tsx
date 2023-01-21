import Meta from '@/components/Meta';
import firebaseClient from '@/lib/firebase';
import authenticatedServerProps from '@/lib/helpers/authenticatedServerProps';
import { Button } from '@mantine/core';
import Image from 'next/image';

export default function App({ user }: { user: UserData }) {
  return (
    <>
      <Meta page={`${user.name}'s homepage`} />

      <section>
        <Image src={user.image ?? ''} alt="cool" width={64} height={64} className="mb-3 rounded-full" />

        <Button onClick={() => firebaseClient.signOut()}>Logout</Button>
      </section>
    </>
  );
}

export const getServerSideProps = authenticatedServerProps();