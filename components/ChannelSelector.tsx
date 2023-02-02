/* eslint-disable @next/next/no-img-element */
import firebaseClient from '@/lib/firebase';
import { useForceUpdate } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import Channel from '@/lib/classes/channel';
import getInitials from '@/lib/helpers/getInitials';
import { Avatar } from '@mantine/core';
import User from '@/lib/classes/user';
import NavLink from './NavLink';
import UserList from './UserList';

interface PreviewProps {
  channel: Channel;
}

const DMPreview = ({ channel }: PreviewProps) => {
  const forceUpdate = useForceUpdate();
  const [user, setUser] = useState<User | undefined>();

  useEffect(() => {
    if (!user) return;

    const handler = () => forceUpdate();

    user.events.on('changed', handler);

    return () => {
      user.events.off('changed', handler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    (async () => {
      const u = await channel.getUser();
      setUser(u);
    })();
  }, [channel]);

  if (!user) return null;

  return (
    <section className="flex gap-3 items-center">
      <UserList user={user} barebone avatarSize={38} />
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
  const channels = [...firebaseClient.managers.channels.cache.values()].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  useEffect(() => {
    const handler = () => {
      forceRender();
    };

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