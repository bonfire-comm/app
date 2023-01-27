import User from '@/lib/classes/user';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faEllipsis, faXmark } from '@fortawesome/free-solid-svg-icons';
import { ActionIcon, Menu } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import firebaseClient from '@/lib/firebase';
import { useClipboard, useForceUpdate } from '@mantine/hooks';
import { shallow } from 'zustand/shallow';
import useBuddies from '@/lib/store/buddies';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import AvatarWithStatus from './AvatarWithStatus';
import Twemoji from './Twemoji';

interface Props {
  user: User;
  showAccept?: boolean;
  enableMenu?: boolean;
  barebone?: boolean;
  avatarSize?: number;
}

export default function UserList({ user, showAccept, enableMenu = true, barebone, avatarSize }: Props) {
  const [added, blocked] = useBuddies((state) => [state.added, state.blocked], shallow);
  const clipboard = useClipboard({ timeout: 500 });
  const forceRender = useForceUpdate();
  const router = useRouter();

  useEffect(() => {
    const handler = () => forceRender();

    user.events.on('changed', handler);

    return () => {
      user.events.off('changed', handler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const acceptPending = async () => {
    try {
      await firebaseClient.managers.user.acceptBuddy(user.id);

      showNotification({
        title: <Twemoji>🎉 Accepted!</Twemoji>,
        message: `You are now friends with ${user.name}`,
        color: 'green'
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);

      showNotification({
        title: <Twemoji>😣 Something went wrong!</Twemoji>,
        message: 'An unknown error occurred',
        color: 'red'
      });
    }
  };

  const ignorePending = async () => {
    try {
      await firebaseClient.managers.user.removeBuddy(user.id);

      showNotification({
        title: <Twemoji>👋 Ignored!</Twemoji>,
        message: `You ignored ${user.name}`,
        color: 'green'
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);

      showNotification({
        title: <Twemoji>😣 Something went wrong!</Twemoji>,
        message: 'An unknown error occurred',
        color: 'red'
      });
    }
  };

  if (barebone) {
    return (
      <section className="flex">
        <section className="flex gap-4 items-center">
          <AvatarWithStatus imageSize={avatarSize} image={user.image} status={user.status} />

          <section>
            <h3 className="font-extrabold text-lg flex gap-1 items-center">
              {user.name}
              <span className="font-medium opacity-75 text-base">#{user.discriminator}</span>
            </h3>
            <p className="font-semibold text-cloudy-200 text-sm">{user.activity?.text ?? <span className="capitalize">{user.status}</span>}</p>
          </section>
        </section>
      </section>
    );
  }

  return (
    <section className="p-4 bg-cloudy-500 rounded-lg flex bg-opacity-80 justify-between items-center gap-4">
      <section className="flex gap-4 items-center">
        <AvatarWithStatus imageSize={avatarSize} image={user.image} status={user.status} />

        <section>
          <h3 className="font-extrabold text-lg flex gap-1 items-center">
            {user.name}
            <span className="font-medium opacity-75 text-base">#{user.discriminator}</span>
          </h3>
          <p className="font-semibold text-cloudy-200 text-sm">{user.activity?.text ?? <span className="capitalize">{user.status}</span>}</p>
        </section>
      </section>

      <section className="flex gap-2 items-center">
        {showAccept && (
          <>
            <ActionIcon onClick={acceptPending} color="green" variant="light" radius="xl" p="md">
              <FontAwesomeIcon
                icon={faCheck}
              />
            </ActionIcon>

            <ActionIcon onClick={ignorePending} color="red" variant="light" radius="xl" p="md">
              <FontAwesomeIcon
                icon={faXmark}
              />
            </ActionIcon>
          </>
        )}

        {enableMenu && (
          <Menu position="left">
            <Menu.Target>
              <ActionIcon color="gray" variant="light" radius="xl" p="md">
                <FontAwesomeIcon
                  icon={faEllipsis}
                />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              {added.includes(user.id) && !blocked.includes(user.id) && (
                <Menu.Item onClick={() => firebaseClient.managers.user.removeBuddy(user.id).catch(() => null)}>Remove buddy</Menu.Item>
              )}

              {blocked.includes(user.id)
                ? (
                  <Menu.Item onClick={() => firebaseClient.managers.user.unblockBuddy(user.id).catch(() => null)}>Unblock buddy</Menu.Item>
                )
                : (
                  <>
                    <Menu.Item className="text-red-400" onClick={() => firebaseClient.managers.user.blockBuddy(user.id).catch(() => null)}>Block buddy</Menu.Item>
                    <Menu.Item onClick={async () => {
                      const id = await firebaseClient.managers.channels.createDM(user.id).catch(() => null);
                      if (!id) return;

                      router.push(`/app/channels/${id}`);
                    }}>Start DM</Menu.Item>
                  </>
                )}

              <Menu.Divider />
              <Menu.Label>Developer</Menu.Label>
              <Menu.Item onClick={() => clipboard.copy(user.id)}>Copy ID</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </section>
    </section>
  );
}