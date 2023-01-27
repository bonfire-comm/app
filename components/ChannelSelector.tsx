/* eslint-disable @next/next/no-img-element */
import firebaseClient from '@/lib/firebase';
import { useForceUpdate } from '@mantine/hooks';
import { useEffect } from 'react';
import Channel from '@/lib/classes/channel';
import { useAsync } from 'react-use';
import useUser from '@/lib/store/user';
import getInitials from '@/lib/helpers/getInitials';
import { Avatar } from '@mantine/core';
import NavLink from './NavLink';

interface PreviewProps {
  channel: Channel;
}

const DMPreview = ({ channel }: PreviewProps) => {
  const currentUserId = useUser((state) => state?.id);
  const user = useAsync(async () => {
    if (!currentUserId) return;

    const [participant] = Object.keys(channel.participants).filter((v) => v !== currentUserId);

    const resolved = await firebaseClient.managers.user.fetch(participant);
    return resolved;
  }, [channel, currentUserId]);

  if (user.loading || !user.value) return null;

  return (
    <section className="flex gap-3 items-center">
      <img className="w-8 rounded-full" src={user.value.image} alt={user.value.name as string} />
      <p className="font-bold text-lg gap-1 flex items-center">
        {user.value.name}

        <span className="font-medium opacity-75 text-base">#{user.value.discriminator}</span>
      </p>
    </section>
  );
};

const Preview = ({ channel }: PreviewProps) => {
  const initials = getInitials(channel.name);

  return (
    <section className="flex gap-3 items-center">
      {channel.image && (
        <img className="w-8 rounded-full" src={channel.image} alt={initials} />
      )}
      {!channel.image && (
        <Avatar color="orange" radius="xl">{initials}</Avatar>
      )}

      <p className="font-bold text-lg gap-1 flex items-center">
        {channel.name}
      </p>
    </section>
  );
};

export default function ChannelSelector() {
  const forceRender = useForceUpdate();
  const channels = [...firebaseClient.managers.channels.cache.values()];

  useEffect(() => {
    const handler = () => forceRender();

    firebaseClient.managers.channels.cache.events.on('changed', handler);
    firebaseClient.managers.channels.cache.events.on('set', handler);

    return () => {
      firebaseClient.managers.channels.cache.events.off('changed', handler);
      firebaseClient.managers.channels.cache.events.off('set', handler);
    };
  });

  return (
    <>
      {channels.map((v) => (
        <NavLink href={`/app/channels/${v.id}`} key={v.id}>
          {v.isDM ? <DMPreview channel={v} /> : <Preview channel={v} />}
        </NavLink>
      ))}
    </>
  );
};