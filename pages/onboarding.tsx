import Meta from '@/components/Meta';
import { Button, TextInput } from '@mantine/core';
import { motion } from 'framer-motion';
import useInternal from '@/lib/store';
import { useForm } from '@mantine/form';
import { useToggle } from '@mantine/hooks';
import { useRouter } from 'next/router';
import useUser from '@/lib/store/user';
import ImagePicker from '@/components/ImagePicker';
import firebaseClient from '@/lib/firebase';
import fetcher from '@/lib/api/fetcher';
import Protected from '@/components/Protected';

export default function Onboarding() {
  const photo = useUser((s) => s.photoURL);
  const router = useRouter();
  const [loading, setLoading] = useToggle();
  const delay = useInternal((state) => state.initialDelay);

  const form = useForm({
    initialValues: {
      image: null as File | Blob | null,
      name: ''
    },
    validateInputOnChange: true,
    validate: {
      name: (value) => {
        if (!value) {
          return 'Please enter your name';
        }

        if (value.length < 3) {
          return 'Name must be at least 3 characters';
        }

        if (value.length > 24) {
          return 'Name must be less than 24 characters';
        }

        return null;
      }
    }
  });

  const onContinue = form.onSubmit(async (values) => {
    setLoading(true);

    try {
      const data = {
        name: values.name,
      } as { name: string; image?: string };

      if (values.image) {
        const url = await firebaseClient.uploadProfilePicture(values.image, false);

        data.image = url;
      }

      await fetcher('/users/me', {
        method: 'POST',
        data
      });

      await firebaseClient.refetchUser();
      await router.push('/app');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      form.setFieldError('name', error?.message);
    } finally {
      setLoading(false);
    }
  });

  return (
    <>
      <Meta page="On-Boarding" />

      <Protected>
        <motion.section
          className="w-full h-screen grid place-items-center"
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.5, delay, ease: 'anticipate' }}
        >
          <section className="border border-cloudy-500 bg-cloudy-600 max-w-[72rem] min-w-[52rem] min-h-[32rem] rounded-xl p-8 flex flex-col">
            <h2 className="font-extrabold text-3xl text-center mb-2">Welcome!</h2>
            <p className="opacity-75 text-center mb-8">We&apos;re pleased to meet you!</p>

            <form onSubmit={onContinue} className="flex gap-5 justify-between flex-grow">
              <section className="flex-grow w-1/2 flex flex-col">
                <h3 className="font-extrabold text-sm text-cloudy-300 mb-2">PROFILE PICTURE</h3>

                <ImagePicker src={photo} enableCropping aspect={1} circularCrop onPick={(img) => form.setFieldValue('image', img)} />
              </section>

              <section className="flex-grow w-1/2 flex flex-col">
                <section className="flex-grow">
                  <TextInput {...form.getInputProps('name')} label="USERNAME" className="mb-4" />
                </section>

                <Button type="submit" loading={loading}>Continue</Button>
              </section>
            </form>
          </section>
        </motion.section>
      </Protected>
    </>
  );
}