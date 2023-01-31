import firebaseClient from '@/lib/firebase';
import { ReactNode, useEffect } from 'react';
import { IdleTimerProvider } from 'react-idle-timer';
import useUser from '@/lib/store/user';
import { ActionIcon, Button, Divider, Input, Menu, TextInput } from '@mantine/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faPencil, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/router';
import CookieSetterBuilder from '@/lib/managers/cookie';
import { closeModal, openModal } from '@mantine/modals';
import { useForm } from '@mantine/form';
import bigButtonClass from '@/lib/helpers/bigButtonClass';
import { useToggle } from '@mantine/hooks';
import trimEmptyParagraphTag from '@/lib/helpers/trimEmptyParagraphTag';
import { isEmpty, omitBy } from 'lodash-es';
import Logo from './Logo';
import Twemoji from './Twemoji';
import NavLink from './NavLink';
import UserList from './UserList';
import ChannelSelector from './ChannelSelector';
import ImagePicker from './ImagePicker';
import TextEditor from './TextEditor';

interface Props {
  children: ReactNode;
  innerHeader?: ReactNode;
}

const ChangeProfileModalContent = () => {
  const user = useUser();
  const [loading, setLoading] = useToggle();
  const form = useForm({
    initialValues: {
      image: null as File | Blob | null,
      name: user?.name,
      about: user?.about,
    }
  });

  useEffect(() => {
    form.setFieldValue('name', user?.name);
    form.setFieldValue('about', user?.about);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSubmit = form.onSubmit(async (values) => {
    const changedValues = omitBy(values, isEmpty);

    if (isEmpty(changedValues)) return;

    setLoading(true);

    await firebaseClient.managers.user.updateUser(changedValues);

    closeModal('edit-profile');
  });

  if (!user) return null;

  return (
    <form onSubmit={onSubmit} className="flex gap-5 justify-between flex-grow">
      <section className="flex-grow w-1/2 flex flex-col">
        <h3 className="font-extrabold text-sm text-cloudy-300 mb-2">PROFILE PICTURE</h3>

        <ImagePicker src={user.image} enableCropping aspect={1} circularCrop onPick={(img) => form.setFieldValue('image', img)} />
      </section>

      <section className="flex-grow w-1/2 flex flex-col">
        <section className="flex-grow mb-4">
          <section className="mb-4">
            <TextInput
              {...form.getInputProps('name')}
              label="USERNAME"
              className="flex-grow"
              rightSection={
                <p className="px-3 font-medium opacity-60 text-sm">#{user.discriminator}</p>
              }
              classNames={{
                rightSection: 'w-auto',
                input: 'pr-20'
              }}
            />
          </section>

          <section className="mb-4">
            <Input.Wrapper label="ABOUT ME">
              <TextEditor
                rightPadding={false}
                content={form.values.about ?? ''}
                className="w-full border-none"
                clearOnSend={false}
                maxCharacters={200}
                onChange={(editor) => form.setFieldValue('about', trimEmptyParagraphTag(editor.getHTML()))}
              />
            </Input.Wrapper>
          </section>
        </section>

        <Button classNames={{ root: bigButtonClass() }} type="submit" loading={loading}>Continue</Button>
      </section>
    </form>
  );
};

const openProfileModal = () => {
  openModal({
    modalId: 'edit-profile',
    title: 'Edit profile',
    children: <ChangeProfileModalContent />,
    size: 'xl',
    centered: true,
  });
};

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
            onClick={openProfileModal}
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