/* eslint-disable @next/next/no-img-element */
import { useForm } from '@mantine/form';
import { closeModal, openConfirmModal, openModal } from '@mantine/modals';
import { useAsync } from 'react-use';
import { Button, MultiSelect, TextInput } from '@mantine/core';
import { useToggle } from '@mantine/hooks';
import ImagePicker from '@/components/ImagePicker';
import { useState } from 'react';
import { useRouter } from 'next/router';
import useBuddies from '../store/buddies';
import firebaseClient from '../firebase';
import User from '../classes/user';
import generateId from './generateId';
import Channel from '../classes/channel';

const CreateChannelModalContent = ({ channel }: { channel?: Channel }) => {
  const router = useRouter();
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useToggle();
  const buddies = useBuddies();
  const form = useForm({
    initialValues: {
      name: channel?.name ?? '',
      description: channel?.description ?? '',
      image: (channel?.image ?? null) as File | Blob | string | null | undefined,
      participants: Object.keys(channel?.participants ?? {}) as string[],
      bans: Object.keys(channel?.bans ?? {}) as string[],
    },
    validateInputOnChange: true,
    validate: {
      name: (value) => {
        if (!value) return 'Name is required';
        if (value.length < 3) return 'Name must be at least 3 characters long';
      }
    }
  });

  const participantValues = useAsync(async () => {
    const users = (await Promise.all(
      buddies.added
        .filter((id) => channel ? !channel.bans[id] : true)
        .map((buddy) => firebaseClient.managers.user.fetch(buddy))
    ))
      .filter(Boolean) as User[];

    return users.map((user) => ({
      value: user.id,
      label: (
        <section className="flex items-center gap-3">
          <img src={user.image} alt="" className="h-10 w-10 rounded-full" />
          <p>{user.name}</p>
        </section>
      ),
    }));
  }, [buddies.added, channel]);

  const bannedValues = useAsync(async () => {
    if (!channel) return [];

    const users = (await Promise.all(
      Object.keys(channel.bans)
        .map((buddy) => firebaseClient.managers.user.fetch(buddy))
    ))
      .filter(Boolean) as User[];

    return users.map((user) => ({
      value: user.id,
      label: (
        <section className="flex items-center gap-3">
          <img src={user.image} alt="" className="h-10 w-10 rounded-full" />
          <p>{user.name}</p>
        </section>
      ),
    }));
  }, [channel]);

  const onSubmit = form.onSubmit(async (values) => {
    if (!firebaseClient.auth.currentUser) return;

    setLoading(true);

    const data: ChannelData = {
      id: generateId(),
      isDM: false,
      pins: [],
      createdAt: new Date(),
      voice: {
        participants: [],
        started: false,
      },
      ...(channel?.toJSON?.() ?? {}),
      name: values.name,
      description: values.description,
      owner: firebaseClient.auth.currentUser.uid,
      participants: values.participants.reduce((prev, curr) => ({ ...prev, [curr]: true }), { [firebaseClient.auth.currentUser.uid]: true }),
      bans: values.bans.reduce((prev, curr) => ({ ...prev, [curr]: true }), {}),
    };

    if (values.image && typeof values.image !== 'string') {
      const filename = `${data.id}-${Date.now()}.webp`;

      await firebaseClient.uploadFile(`channels/${filename}`, values.image);

      const url = `${
        (await firebaseClient.getFileUrl(`channels/${filename}`)).split('?')[0]
      }?alt=media`;

      data.image = url;
    }

    await firebaseClient.managers.channels.upset(data);
    await router.push(`/app/channels/${data.id}`);

    closeModal('create-channel');
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <section className="flex gap-4">
        <section className="flex-grow w-1/2 flex flex-col">
          <h3 className="font-extrabold text-sm text-cloudy-300 mb-2">PROFILE PICTURE</h3>

          <ImagePicker
            src={channel?.image}
            enableCropping
            aspect={1}
            circularCrop
            onCropping={() => setDisabled(true)}
            onPick={(img) => {
              form.setFieldValue('image', img);
              setDisabled(false);
            }}
          />
        </section>

        <section className="flex-grow w-1/2">
          <TextInput
            {...form.getInputProps('name')}
            label="NAME"
            maxLength={30}
            className="flex-grow mb-3"
            classNames={{
              rightSection: 'w-auto',
            }}
          />

          <TextInput
            {...form.getInputProps('description')}
            maxLength={50}
            label="DESCRIPTION"
            className="flex-grow"
            classNames={{
              rightSection: 'w-auto',
            }}
          />

          {!participantValues.loading && participantValues.value && (
            <MultiSelect
              {...form.getInputProps('participants')}
              // @ts-expect-error - yes
              data={participantValues.value}
              className="mt-3"
              label="PARTICIPANTS"
              classNames={{
                defaultValue: 'h-auto py-2',
                defaultValueLabel: 'text-base',
                input: 'py-2'
              }}
              maxSelectedValues={30}
            />
          )}

          {!bannedValues.loading && bannedValues.value && channel && (
            <MultiSelect
              {...form.getInputProps('bans')}
              // @ts-expect-error - yes
              data={bannedValues.value}
              className="mt-3"
              label="BANS"
              classNames={{
                defaultValue: 'h-auto py-2',
                defaultValueLabel: 'text-base',
                input: 'py-2'
              }}
            />
          )}
        </section>
      </section>

      <section className="flex justify-end gap-3">
        {channel && (
          <Button
            color="red"
            variant="light"
            onClick={() => {
              closeModal('edit-channel');
              openConfirmModal({
                centered: true,
                title: 'Are you sure?',
                children: <p>This action is not reversible.</p>,
                closeOnConfirm: true,
                labels: {
                  confirm: 'Continue',
                  cancel: 'Cancel'
                },
                confirmProps: {
                  color: 'red'
                },
                cancelProps: {
                  color: 'gray'
                },
                onConfirm: async () => {
                  await channel.delete();
                },
                zIndex: 1000000000
              });
            }}
          >
            Delete group
          </Button>
        )}

        <Button
          disabled={!form.values.name || !!form.errors.name || disabled}
          color="indigo"
          type="submit"
          loading={loading}
          loaderProps={{
            color: 'blue'
          }}
        >
          {channel ? 'Save' : 'Create'}
        </Button>
      </section>
    </form>
  );
};

const openCreateChannelModal = () => {
  openModal({
    modalId: 'create-channel',
    title: 'Create new channel',
    children: <CreateChannelModalContent />,
    size: 'xl',
    centered: true,
  });
};

export default openCreateChannelModal;

export const openEditChannelModal = (channel: Channel) => {
  openModal({
    modalId: 'edit-channel',
    title: 'Edit channel',
    children: <CreateChannelModalContent channel={channel} />,
    size: 'xl',
    centered: true,
  });
};