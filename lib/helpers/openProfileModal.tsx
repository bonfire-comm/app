/* eslint-disable @next/next/no-img-element */
import { closeModal, openModal } from '@mantine/modals';
import { ActionIcon, Input, Tooltip } from '@mantine/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faICursor, faPencil, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from 'react';
import { DateTime } from 'luxon';
import { useRouter } from 'next/router';
import { showNotification } from '@mantine/notifications';
import Twemoji from '@/components/Twemoji';
import { useAsync } from 'react-use';
import User from '../classes/user';
import loadImage from './loadImage';
import getSignificantColor from './getSignificantColor';
import firebaseClient from '../firebase';
import openEditProfileModal from './openEditProfileModal';

const ProfileModalContent = ({ user: u, bannerColor = 'rgb(41, 58, 60)' }: { user: User; bannerColor?: string; tone?: 'light' | 'dark' }) => {
  const [user, setUser] = useState(u);

  useEffect(() => {
    u.fetch().then((uRes) => uRes && setUser(uRes));
  }, [u]);

  const contentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const createdDate = DateTime.fromJSDate(user.createdAt);

  const isBuddy = useAsync(() => user.isBuddy(), [user]);

  return (
    <section>
      <section className="h-28" style={{ background: bannerColor }}></section>

      <section className="relative">
        <img src={user.image} alt="" className="ml-6 absolute -translate-y-1/2 w-28 h-28 rounded-full border-[8px] border-cloudy-800" draggable={false} />

        <section className="p-6">
          <section className="flex justify-end h-8 gap-1">
            {!user.isSelf && (
              <>
                {!isBuddy.value && <Tooltip label="Add friend">
                  <ActionIcon
                    color="green"
                    variant="subtle"
                    p="md"
                    radius="xl"
                    onClick={async () => {
                      try {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        await firebaseClient.managers.user.addBuddy(user.name!, user.discriminator);

                        showNotification({
                          color: 'green',
                          title: <Twemoji>✅ Sent!</Twemoji>,
                          message: 'Friend request sent!',
                          className: 'z-[99999999999]'
                        });
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      } catch (e: any) {
                        if (e.message === 'already-pending') {
                          return showNotification({
                            color: 'orange',
                            title: <Twemoji>⚠️ Already pending!</Twemoji>,
                            message: 'You already have a pending friend request with this user.',
                            className: 'z-[99999999999]'
                          });
                        }
                      }
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faUserPlus}
                      className="text-cloudy-100"
                    />
                  </ActionIcon>
                </Tooltip>}

                <ActionIcon
                  color="blue"
                  variant="subtle"
                  p="md"
                  radius="xl"
                  onClick={async () => {
                    const id = await firebaseClient.managers.channels.createDM(user.id).catch(() => null);
                    if (!id) return;

                    router.push(`/app/channels/${id}`);
                    closeModal('profile-modal');
                  }}
                >
                  <FontAwesomeIcon
                    icon={faICursor}
                    className="text-cloudy-100"
                  />
                </ActionIcon>
              </>
            )}

            {user.isSelf && (
              <ActionIcon
                color="orange"
                variant="subtle"
                p="md"
                radius="xl"
                onClick={() => openEditProfileModal()}
              >
                <FontAwesomeIcon
                  icon={faPencil}
                  className="text-cloudy-100"
                />
              </ActionIcon>
            )}
          </section>

          <section className="pt-2">
            <h1 className="text-xl font-extrabold flex items-center">
              {user.name}
              <p className="text-lg font-medium opacity-75">#{user.discriminator}</p>
            </h1>
          </section>

          {user.about && (
            <Input.Wrapper label="ABOUT ME" className="mt-3">
              <section
                ref={contentRef}
                className="user_message break-all whitespace-pre-line p-4 rounded-lg bg-cloudy-900"
                dangerouslySetInnerHTML={{ __html: user.about }}
              />
            </Input.Wrapper>
          )}

          <Input.Wrapper label="JOINED AT" className="mt-3">
            <p className="font-semibold text-sm text-cloudy-100">{createdDate.toLocaleString(DateTime.DATE_SHORT)} {createdDate.toLocaleString(DateTime.TIME_SIMPLE)}</p>
          </Input.Wrapper>
        </section>
      </section>
    </section>
  );
};

export default async function openProfileModal(user: User) {
  const bannerColor = await loadImage(user.image).then(getSignificantColor).catch(() => null);

  openModal({
    modalId: 'profile-modal',
    centered: true,
    children: <ProfileModalContent bannerColor={bannerColor?.color} tone={bannerColor?.tone} user={user} />,
    classNames: {
      modal: 'p-0 relative overflow-hidden rounded-lg',
      header: 'absolute top-0 left-0 right-0 w-full p-3',
      close: `block z-20 grid place-items-center ${bannerColor?.tone === 'light' ? 'text-cloudy-900' : 'text-cloudy-100'}`,
    },
    zIndex: 1000000
  });
}