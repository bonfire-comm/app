import ImagePicker from '@/components/ImagePicker';
import TextEditor from '@/components/TextEditor';
import { TextInput, Input, Button } from '@mantine/core';
import { useForm } from '@mantine/form';
import { closeModal, openModal } from '@mantine/modals';
import { useState, useEffect } from 'react';
import { useToggle } from '@mantine/hooks';
import firebaseClient from '../firebase';
import useUser from '../store/user';
import bigButtonClass from './bigButtonClass';
import trimEmptyParagraphTag from './trimEmptyParagraphTag';

const ChangeProfileModalContent = () => {
  const user = useUser();
  const [loading, setLoading] = useToggle();
  const [disabled, setDisabled] = useState(false);
  const form = useForm({
    initialValues: {
      image: user?.image as File | Blob | string | null | undefined,
      name: user?.name,
      about: user?.about,
    }
  });

  useEffect(() => {
    form.setFieldValue('image', user?.image);
    form.setFieldValue('name', user?.name);
    form.setFieldValue('about', user?.about);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSubmit = form.onSubmit(async (values) => {
    setLoading(true);

    await firebaseClient.managers.user.updateUser(values);

    closeModal('edit-profile');
  });

  if (!user) return null;

  return (
    <form onSubmit={onSubmit} className="flex gap-5 justify-between flex-grow">
      <section className="flex-grow w-1/2 flex flex-col">
        <h3 className="font-extrabold text-sm text-cloudy-300 mb-2">PROFILE PICTURE</h3>

        <ImagePicker
          src={user.image}
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

        <Button disabled={disabled} classNames={{ root: bigButtonClass() }} type="submit" loading={loading}>Continue</Button>
      </section>
    </form>
  );
};

const openEditProfileModal = () => {
  openModal({
    modalId: 'edit-profile',
    title: 'Edit profile',
    children: <ChangeProfileModalContent />,
    size: 'xl',
    centered: true,
  });
};

export default openEditProfileModal;