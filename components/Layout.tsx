import firebaseClient from '@/lib/firebase';
import { ReactNode } from 'react';
import { IdleTimerProvider } from 'react-idle-timer';
import useUser from '@/lib/store/user';
import { ActionIcon, Divider, Menu, Portal, Tooltip } from '@mantine/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faPencil, faPlus, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/router';
import CookieSetterBuilder from '@/lib/managers/cookie';
import openEditProfileModal from '@/lib/helpers/openEditProfileModal';
import openCreateChannelModal from '@/lib/helpers/openCreateChannelModal';
import Logo from './Logo';
import Twemoji from './Twemoji';
import NavLink from './NavLink';
import UserList from './UserList';
import ChannelSelector from './ChannelSelector';
import ContextMenu from './ContextMenu';

interface Props {
  children: ReactNode;
  innerHeader?: ReactNode;
}

const ControlBar = () => {
  const user = useUser();
  const router = useRouter();

  const logout = async () => {
    await new CookieSetterBuilder().remove('token:/').commit();

    Promise.all([
      firebaseClient.auth.signOut(),
      router.push('/login')
    ]);
  };

  if (!user) return null;

  return (
    <section className="px-4 justify-between gap-4 flex items-center bg-cloudy-800 bg-opacity-40">
      <UserList user={user} barebone />

      <Menu width={200} offset={10} withArrow arrowSize={8}>
        <Menu.Target>
          <ActionIcon color="gray" radius="xl">
            <FontAwesomeIcon
              icon={faEllipsisV}
            />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item
            onClick={openEditProfileModal}
            icon={
              <FontAwesomeIcon
                icon={faPencil}
              />
            }
          >
            Edit profile
          </Menu.Item>

          <Menu.Item
            color="red"
            icon={
              <FontAwesomeIcon
                icon={faRightFromBracket}
              />
            }
            onClick={logout}
          >
            Logout
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
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
      <Portal>
        <ContextMenu />
      </Portal>

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

            <section className="flex justify-between px-3 my-2 items-center gap-4">
              <Divider className="w-full" />

              <Tooltip
                label="Create Channel"
                color="blue"
                withArrow
                arrowSize={6}
                offset={8}
              >
                <FontAwesomeIcon
                  icon={faPlus}
                  className="cursor-pointer"
                  onClick={openCreateChannelModal}
                />
              </Tooltip>
            </section>

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