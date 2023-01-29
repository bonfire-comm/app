import firebaseClient from '@/lib/firebase';
import { ReactNode } from 'react';
import { IdleTimerProvider } from 'react-idle-timer';
import useUser from '@/lib/store/user';
import { Button, Divider } from '@mantine/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/router';
import CookieSetterBuilder from '@/lib/managers/cookie';
import Logo from './Logo';
import Twemoji from './Twemoji';
import NavLink from './NavLink';
import UserList from './UserList';
import ChannelSelector from './ChannelSelector';

interface Props {
  children: ReactNode;
  innerHeader?: ReactNode;
}

const ControlBar = () => {
  const user = useUser();
  const router = useRouter();

  if (!user) return null;

  return (
    <section className="px-4 justify-between gap-4 flex items-center bg-cloudy-800 bg-opacity-40">
      <UserList user={user} barebone />

      <Button
        color="red"
        variant="subtle"
        onClick={async () => {
          await new CookieSetterBuilder().remove('token:/').commit();

          Promise.all([
            firebaseClient.auth.signOut(),
            router.push('/login')
          ]);
        }}
      >
        <FontAwesomeIcon
          icon={faRightFromBracket}
        />
      </Button>
    </section>
  );
};

export default function Layout({ children, innerHeader = (<section></section>) }: Props) {
  return (
    <IdleTimerProvider
      timeout={60_000}
      onIdle={() => firebaseClient.managers.user.setStatus('idle')}
      onActive={() => firebaseClient.managers.user.setStatus('online')}
    >
      <main className="grid grid-cols-[20rem_1fr] h-screen w-screen relative overflow-hidden">
        <section className="grid grid-rows-[3.5rem_1fr_6rem] w-full bg-cloudy-700 bg-opacity-80">
          <section className="shadow flex items-center px-4 w-full h-full">
            <Logo className="h-6" />
          </section>

          <section className="p-4 flex flex-col gap-3 overflow-y-auto">
            <NavLink href="/app">
              <Twemoji>👋</Twemoji>
              <p className="text-lg font-bold text-white">Buddies</p>
            </NavLink>

            <NavLink href="/app/music">
              <Twemoji>🎵</Twemoji>
              <p className="text-lg font-bold text-white">Music</p>
            </NavLink>

            <Divider className="my-2 w-1/2 mx-auto" />

            <ChannelSelector />
          </section>

          <ControlBar />
        </section>

        <section className="grid grid-rows-[3.5rem_1fr] bg-cloudy-600 bg-opacity-80 overflow-hidden">
          <section className="shadow w-full h-full">
            {innerHeader}
          </section>

          {children}
        </section>
      </main>
    </IdleTimerProvider>
  );
}