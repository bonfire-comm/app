import firebaseClient from '@/lib/firebase';
import { ReactNode, useEffect } from 'react';
import { IdleTimerProvider } from 'react-idle-timer';
import useUser from '@/lib/store/user';
import { ActionIcon, Divider, Menu, Portal, Tooltip } from '@mantine/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEarDeaf, faEarListen, faEllipsisV, faMicrophone, faMicrophoneSlash, faPencil, faPhoneSlash, faPlus, faRightFromBracket, faSignal } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/router';
import CookieSetterBuilder from '@/lib/managers/cookie';
import openEditProfileModal from '@/lib/helpers/openEditProfileModal';
import openCreateChannelModal from '@/lib/helpers/openCreateChannelModal';
import useVoice from '@/lib/store/voice';
import getVoiceStateClassName from '@/lib/helpers/getVoiceStateClassName';
import { shallow } from 'zustand/shallow';
import { useAsync } from 'react-use';
import Link from 'next/link';
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

const MeetingIndicator = () => {
  const [meeting, activeChannelId] = useVoice((s) => [s.meeting, s.activeChannelId], shallow);
  const [deafened, state, muted] = useVoice((s) => [s.deafened, s.state, s.muted], shallow);

  useEffect(() => {
    if (!meeting) return;

    const stateChangeHandler = ({ state: currentState }: { state: MeetingState }) => useVoice.setState({ state: currentState });

    // @ts-expect-error Undocumented
    meeting.on('meeting-state-changed', stateChangeHandler);

    return () => {
      // @ts-expect-error Undocumented
      meeting.off('meeting-state-changed', stateChangeHandler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meeting]);

  const channel = useAsync(async () => {
    if (!activeChannelId) return null;

    return firebaseClient.managers.channels.fetch(activeChannelId);
  }, [activeChannelId]);

  const name = useAsync(async () => channel.value?.resolveName(), [channel]);

  if (!meeting) return null;

  return (
    <section
      className="flex justify-between items-center gap-3 px-6 bg-cloudy-800 bg-opacity-75"
    >
      <section className={['flex gap-4 items-center', getVoiceStateClassName(state)].join(' ')}>
        <FontAwesomeIcon
          icon={faSignal}
        />

        <section className="leading-tight flex flex-col">
          <Link
            className="capitalize font-bold cursor-pointer hover:underline hover:underline-offset-1"
            href={`/app/channels/${channel.value?.id}/call`}
          >
            {state.toLowerCase()}
          </Link>

          <Link className="text-white opacity-75" href={`/app/channels/${channel.value?.id}`}>
            {name.value}
          </Link>
        </section>
      </section>

      <section className="flex gap-3">
        <Tooltip
          label={muted ? 'Unmute' : 'Mute'}
          color="blue"
          withArrow
          arrowSize={6}
          offset={10}
        >
          <FontAwesomeIcon
            icon={muted ? faMicrophoneSlash : faMicrophone}
            className="cursor-pointer text-cloudy-200 hover:text-cloudy-100 transition-colors duration-200 ease-in-out"
            onClick={() => {
              const toggle = !muted;

              useVoice.setState({ muted: toggle });

              if (toggle) meeting.muteMic();
              else meeting.unmuteMic();
            }}
          />
        </Tooltip>

        <Tooltip
          label={deafened ? 'Undeafen' : 'Deafen'}
          color="blue"
          withArrow
          arrowSize={6}
          offset={10}
        >
          <FontAwesomeIcon
            icon={deafened ? faEarDeaf : faEarListen}
            className="cursor-pointer text-cloudy-200 hover:text-cloudy-100 transition-colors duration-200 ease-in-out"
            onClick={() => {
              const toggle = !deafened;

              useVoice.setState({
                deafened: toggle,
              });
            }}
          />
        </Tooltip>

        <Tooltip
          label="Leave"
          color="red"
          withArrow
          arrowSize={6}
          offset={10}
        >
          <FontAwesomeIcon
            icon={faPhoneSlash}
            className="cursor-pointer text-cloudy-200 hover:text-red-400 transition-colors duration-200 ease-in-out"
            onClick={() => {
              meeting.leave();
            }}
          />
        </Tooltip>
      </section>
    </section>
  );
};

export default function Layout({ children, innerHeader = (<section></section>) }: Props) {
  const meeting = useVoice((s) => s.meeting);

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
        <section className={`grid ${!meeting ? 'grid-rows-[3.5rem_1fr_6rem]' : 'grid-rows-[3.5rem_1fr_4rem_6rem]'} w-full bg-cloudy-700 bg-opacity-80`}>
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

          {meeting && (
            <MeetingIndicator />
          )}

          <ControlBar />
        </section>

        <section className="grid grid-rows-[3.5rem_1fr] bg-cloudy-600 bg-opacity-80 overflow-hidden relative">
          <section className="shadow w-full h-full">
            {innerHeader}
          </section>

          {children}
        </section>
      </main>
    </IdleTimerProvider>
  );
}