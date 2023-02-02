/* eslint-disable @next/next/no-img-element */
import { useForm } from '@mantine/form';
import { closeModal, openModal } from '@mantine/modals';
import { useAsync } from 'react-use';
import { Button, MultiSelect, TextInput } from '@mantine/core';
import { useToggle } from '@mantine/hooks';
import ImagePicker from '@/components/ImagePicker';
import { useState } from 'react';
import { useRouter } from 'next/router';
import useBuddies from '../store/buddies';
import firebaseClient from '../firebase';
import User from '../classes/user';
import bigButtonClass from './bigButtonClass';
import generateId from './generateId';

const CreateChannelModalContent = () => {
  const router = useRouter();
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useToggle();
  const buddies = useBuddies();
  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      image: null as File | Blob | null | undefined,
      participants: [] as string[],
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
    const users = (await Promise.all(buddies.added.map((buddy) => firebaseClient.managers.user.fetch(buddy)))).filter(Boolean) as User[];

    return users.map((user) => ({
      value: user.id,
      label: (
        <section className="flex items-center gap-3">
          <img src={user.image} alt="" className="h-10 w-10 rounded-full" />
          <p>{user.name}</p>
        </section>
      ),
    }));
  }, [buddies.added]);

  const onSubmit = form.onSubmit(async (values) => {
    if (!firebaseClient.auth.currentUser) return;

    setLoading(true);

    const data: ChannelData = {
      id: generateId(),
      name: values.name,
      description: values.description,
      isDM: false,
      owner: firebaseClient.auth.currentUser.uid,
      participants: values.participants.reduce((prev, curr) => ({ ...prev, [curr]: true }), { [firebaseClient.auth.currentUser.uid]: true }),
      pins: [],
      createdAt: new Date(),
      bans: {},
      voice: {
        participants: [],
        started: false,
      }
    };

    if (values.image) {
      const filename = `${data.id}-${Date.now()}.webp`;

      await firebaseClient.uploadFile(`channels/${filename}`, values.image);

      const url = `${
        (await firebaseClient.getFileUrl(`channels/${filename}`)).split('?')[0]
      }?alt=media`;

      data.image = url;
    }

    await firebaseClient.managers.channels.create(data);
    await router.push(`/app/channels/${data.id}`);

    closeModal('create-channel');
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <section className="flex gap-4">
        <section className="flex-grow flex flex-col">
          <h3 className="font-extrabold text-sm text-cloudy-300 mb-2">PROFILE PICTURE</h3>

          <ImagePicker
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

        <section className="flex-grow">
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

          {!participantValues.loading && participantValues.value && participantValues.value.length && (
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
        </section>
      </section>

      <section className="flex justify-end ">
        <Button disabled={!form.values.name || !!form.errors.name || disabled} classNames={{ root: bigButtonClass() }} type="submit" loading={loading}>Create</Button>
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