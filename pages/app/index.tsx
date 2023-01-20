import Meta from '@/components/Meta';
import firebaseClient from '@/lib/firebase';
import authenticatedServerProps from '@/lib/helpers/authenticatedServerProps';
import useUser from '@/lib/store/user';
import { Button } from '@mantine/core';
import Image from 'next/image';
import { shallow } from 'zustand/shallow';

export default function App({ user }: { user: UserData}) {
  const [name, photo] = useUser((s) => [s?.name, s?.image], shallow);

  console.log(user);


  return (
    <>
      <Meta page={`${name}'s homepage`} />

      <section>
        <Image src={photo ?? ''} alt="cool" width={64} height={64} className="mb-3 rounded-full" />

        <Button onClick={() => firebaseClient.signOut()}>Logout</Button>
      </section>
    </>
  );
}

export const getServerSideProps = authenticatedServerProps();