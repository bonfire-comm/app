/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import authenticatedServerProps from '@/lib/helpers/authenticatedServerProps';
import admin from '@/lib/firebase/admin';
import { pick } from 'lodash-es';
import { Avatar, Button } from '@mantine/core';
import getInitials from '@/lib/helpers/getInitials';
import bigButtonClass from '@/lib/helpers/bigButtonClass';
import firebaseClient from '@/lib/firebase';
import { useRouter } from 'next/router';
import Meta from '@/components/Meta';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faCircleXmark } from '@fortawesome/free-solid-svg-icons';

interface Props {
  invite?: ChannelInviteData | null;
  channel?: Pick<ChannelData, 'id' | 'name' | 'owner' | 'image' | 'participants'> | null;
  inviter?: Pick<UserData, 'id' | 'name' | 'discriminator'> | null;
  banned?: boolean;
}

export default function InvitePage({ invite, channel, inviter, banned }: Props) {
  const router = useRouter();

  const accept = async () => {
    if (!invite) return;

    const ch = await firebaseClient.managers.channels.acceptInvite(invite.id);
    if (!ch) return;

    await router.push(`/app/channels/${ch.id}`);
  };

  return (
    <>
      <Meta page="Invite" />

      <section className="w-screen h-screen grid place-items-center">
        <section className="border border-cloudy-500 bg-cloudy-600 p-6 rounded-xl min-w-[24rem] max-w-[24rem] flex flex-col items-center">
          {invite && channel && Object.keys(channel.participants).length < 30 && inviter && (
            <>
              <h3 className="text-cloudy-300">You&apos;ve been invited to</h3>
              <section className="mt-6 mb-2">
                {channel.image && (
                  <img className="w-24 h-24 rounded-full mx-auto block mb-2" src={channel.image} alt="" />
                )}
                {!channel.image && (
                  <Avatar color="orange" className="rounded-full w-24 h-24 mx-auto mb-2" classNames={{ placeholder: 'text-xl' }}>{getInitials(channel.name)}</Avatar>
                )}

                <h1 className="text-3xl font-extrabold">{channel.name}</h1>
              </section>

              <p className="text-cloudy-300 mb-8">by <span className="font-semibold">{inviter.name}</span></p>

              <Button onClick={accept} className="w-full" classNames={{ root: bigButtonClass() }} type="submit">Accept</Button>
            </>
          )}

          {banned && (
            <>
              <FontAwesomeIcon
                icon={faBan}
                className="text-6xl mb-4 text-red-400"
              />

              <h2 className="text-xl font-extrabold">You&apos;re banned from this group</h2>
            </>
          )}

          {!invite && !banned && (
            <>
              <FontAwesomeIcon
                icon={faCircleXmark}
                className="text-6xl mb-4 text-red-400"
              />

              <h2 className="text-xl font-extrabold">{channel && Object.keys(channel.participants).length <= 30 ? 'Group is full' : 'Invalid Invite'}</h2>
            </>
          )}
        </section>
      </section>
    </>
  );
}

export const getServerSideProps = authenticatedServerProps(async (ctx) => {
  const { phrase } = ctx.query;
  if (!phrase) {
    return {
      notFound: true
    };
  }

  const data = (await admin.firestore().doc(`invites/${phrase}`).get()).data() as ChannelInviteData | undefined ?? null;
  if (!data) {
    return {
      props: {}
    };
  }

  data.createdAt = (data as any).createdAt.toDate().toISOString();

  const channel = data
    ? (await admin.firestore().doc(`channels/${data.channelId}`).get()).data() as ChannelData
    : null;

  if (channel && channel.bans[ctx.user.id]) {
    return {
      props: {
        banned: true
      }
    };
  }

  const inviter = data
    ? (await admin.firestore().doc(`users/${data.createdBy}`).get()).data() as UserData
    : null;

  return {
    props: {
      invite: data,
      channel: pick(channel, ['id', 'name', 'owner', 'image', 'participants']),
      inviter: pick(inviter, ['id', 'name', 'discriminator'])
    }
  };
});