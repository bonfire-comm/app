import Layout from '@/components/Layout';
import Meta from '@/components/Meta';
import Twemoji from '@/components/Twemoji';
import firebaseClient from '@/lib/firebase';
import authenticatedServerProps from '@/lib/helpers/authenticatedServerProps';
import { Button, Tabs } from '@mantine/core';
import Image from 'next/image';
import { Dispatch, SetStateAction, useState } from 'react';

type TabNames = 'online' | 'all' | 'pending' | 'blocked' | 'add';

const SelectorHeader = () => (
  <section className="w-full h-full flex items-center px-4 gap-1">
    <Twemoji>👋</Twemoji>
    <p className="text-lg font-bold text-white">Buddies</p>
  </section>
);

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

export default function App({ user }: { user: UserData }) {
  const [activeTab, setActiveTab] = useState<TabNames>('online');

  // TODO: buddy management

  return (
    <>
      <Meta page={`${user.name}'s homepage`} />

      <Layout
        selectorHeader={<SelectorHeader />}
        innerHeader={<BuddiesTabs active={activeTab} setActiveTab={setActiveTab} />}
      >
        <section>
          <Image src={user.image ?? ''} alt="cool" width={64} height={64} className="mb-3 rounded-full" />

          <Button onClick={() => firebaseClient.signOut()}>Logout</Button>
        </section>
      </Layout>
    </>
  );
}

export const getServerSideProps = authenticatedServerProps();