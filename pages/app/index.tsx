import EmptyPlaceholder from '@/components/EmptyPlaceholder';
import Layout from '@/components/Layout';
import Meta from '@/components/Meta';
import Twemoji from '@/components/Twemoji';
import UserList from '@/components/UserList';
import User from '@/lib/classes/user';
import firebaseClient from '@/lib/firebase';
import authenticatedServerProps from '@/lib/helpers/authenticatedServerProps';
import useBuddies from '@/lib/store/buddies';
import { Button, Divider, Tabs, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useForceUpdate } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import { Dispatch, SetStateAction, useEffect, useReducer, useState } from 'react';

type TabNames = 'online' | 'all' | 'pending' | 'blocked' | 'add';

const BuddiesTabs = ({ active, setActiveTab }: { active: string; setActiveTab: Dispatch<SetStateAction<TabNames>> }) => (
  <section className="flex items-center w-full h-full px-4">
    <Tabs variant="pills" value={active} onTabChange={(v) => setActiveTab(v as TabNames)}>
      <Tabs.List>
        <Tabs.Tab value="online">Online</Tabs.Tab>
        <Tabs.Tab value="all">All</Tabs.Tab>
        <Tabs.Tab value="pending">Pending</Tabs.Tab>
        <Tabs.Tab value="blocked">Blocked</Tabs.Tab>
        <Tabs.Tab value="add" className="bg-green-600 text-white data-[active=true]:text-green-500 data-[active=true]:bg-transparent">Add Buddy</Tabs.Tab>
      </Tabs.List>
    </Tabs>
  </section>
);

const AddBuddyTab = () => {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      tag: ''
    },
  });

  const sendRequest = form.onSubmit(async (values) => {
    setLoading(true);

    try {
      const [name, discriminator] = values.tag.split('#');
      await firebaseClient.managers.user.addBuddy(name, parseInt(discriminator, 10));

      showNotification({
        title: <Twemoji>✅ Yay!</Twemoji>,
        message: 'Buddy request sent!',
        color: 'green',
      });

      form.reset();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      let { message } = e;

      switch (message) {
        case 'not-found': {
          message = 'User not found';
          break;
        }

        case 'already-added': {
          message = 'User is already added!';
          break;
        }

        case 'already-pending': {
          message = 'You already sent a request!';
          break;
        }

        case 'blocked': {
          message = 'You are blocked by this user!';
          break;
        }

        default: {
          message = 'An unknown error occurred';
          break;
        }
      }

      form.setFieldError('tag', message);
    } finally {
      setLoading(false);
    }
  });

  return (
    <section className="p-6 flex flex-col">
      <h3 className="font-extrabold uppercase mb-2">Add buddy</h3>
      <p className="text-cloudy-300 text-sm font-medium mb-3">You can add a buddy by their tag. Remember, iT&apos;S cAsE sEnsItIvE</p>

      <form onSubmit={sendRequest}>
        <TextInput
          {...form.getInputProps('tag')}
          placeholder="Enter a username#0000"
          className="text-cloudy-500"
          maxLength={100}
          rightSection={
            <Button
              loading={loading}
              loaderProps={{ color: 'white' }}
              type="submit"
              disabled={!(/^.*#(\d\d\d\d)$/g).test(form.values.tag)}
              className="absolute top-2 right-2 bottom-2 h-auto w-auto text-sm py-0 px-3"
              color="blue"
            >
              Send request
            </Button>
          }
        />
      </form>

      <Divider className="my-4" />

      <section className="relative h-full">
        <EmptyPlaceholder />
      </section>
    </section>
  );
};

const PendingBuddies = ({ data }: { data: User[] }) => (
  <section className="p-6 relative">
    <h3 className="font-extrabold uppercase mb-2">Pending</h3>

    {data.length > 0 && data.map((u) => <UserList user={u} key={u.id} showAccept />)}
    {data.length === 0 && (<EmptyPlaceholder />)}
  </section>
);

export default function App({ user }: { user: UserData }) {
  const buddies = useBuddies();
  const [activeTab, setActiveTab] = useState<TabNames>('online');
  const [buddiesData, setBuddiesData] = useState<User[]>([]);

  const forceRender = useForceUpdate();
  const [refetchState, refetch] = useReducer((i) => i + 1, 0);

  useEffect(() => {
    const handler = () => {
      refetch();
    };

    firebaseClient.managers.user.cache.events.on('changed', handler);

    return () => {
      firebaseClient.managers.user.cache.events.off('changed', handler);
    };
  }, [forceRender]);

  useEffect(() => {
    let active = true;

    (async () => {
      switch (activeTab) {
        case 'online': {
          const all = (await Promise.all(buddies.added.map((id) => firebaseClient.managers.user.fetch(id)))).filter(Boolean) as User[];
          if (!active) return;

          setBuddiesData(all.filter((u) => u?.status === 'online' || u?.status === 'idle'));
          break;
        }

        case 'all': {
          const all = (await Promise.all(buddies.added.map((id) => firebaseClient.managers.user.fetch(id)))).filter(Boolean) as User[];
          if (!active) return;

          setBuddiesData(all);
          break;
        }

        case 'pending': {
          const all = (await Promise.all(buddies.pending.map((id) => firebaseClient.managers.user.fetch(id)))).filter(Boolean) as User[];
          if (!active) return;

          setBuddiesData(all);
          break;
        }

        case 'blocked': {
          const all = (await Promise.all(buddies.blocked.map((id) => firebaseClient.managers.user.fetch(id)))).filter(Boolean) as User[];
          if (!active) return;

          setBuddiesData(all);
          break;
        }

        default: break;
      }
    })();

    return () => {
      active = false;
    };
  }, [activeTab, buddies, refetchState]);

  return (
    <>
      <Meta page={`${user.name}'s homepage`} />

      <Layout
        innerHeader={<BuddiesTabs active={activeTab} setActiveTab={setActiveTab} />}
      >
        {activeTab === 'add' && <AddBuddyTab />}
        {activeTab === 'pending' && <PendingBuddies data={buddiesData} />}
        {activeTab !== 'add' && activeTab !== 'pending' && (
          <section className="p-6 relative">
            <h3 className="font-extrabold uppercase mb-2">{activeTab}</h3>

            {buddiesData.length > 0 && buddiesData.map((u) => <UserList user={u} key={u.id} />)}
            {buddiesData.length === 0 && <EmptyPlaceholder />}
          </section>
        )}
      </Layout>
    </>
  );
}

export const getServerSideProps = authenticatedServerProps();