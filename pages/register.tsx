import Meta from '@/components/Meta';
import { Button, TextInput } from '@mantine/core';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faGoogle, faMicrosoft } from '@fortawesome/free-brands-svg-icons';
import { motion } from 'framer-motion';
import useInternal from '@/lib/store';
import { useForm } from '@mantine/form';
import firebaseClient from '@/lib/firebase';
import { useToggle } from '@mantine/hooks';
import { z } from 'zod';
import { useRouter } from 'next/router';
import useUser from '@/lib/store/user';
import { useEffect } from 'react';
import bigButtonClass from '@/lib/helpers/bigButtonClass';
import guestServerProps from '@/lib/helpers/guestServerProps';

export default function Register() {
  const id = useUser((s) => s?.id);

  const router = useRouter();
  const [loading, setLoading] = useToggle();
  const delay = useInternal((state) => state.initialDelay);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      confirm: '',
    },
    validateInputOnChange: true,
    validate: {
      email: (value) => {
        if (!z.string().email().safeParse(value).success) return 'Invalid email address';
      },
      password: (value) => {
        if (value.length < 8) {
          return 'Password must be at least 8 characters';
        }
      },
      confirm: (value, values) => {
        if (value !== values.password) {
          return 'Passwords do not match';
        }
      }
    }
  });

  const onSignIn = form.onSubmit(async (values) => {
    setLoading(true);

    try {
      await firebaseClient.createUserWithEmailAndPassword(values.email, values.password);
      await firebaseClient.generateToken();
      await router.push('/onboarding');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        return form.setErrors({
          email: 'Email already in use',
        });
      }

      form.setErrors({
        email: error.code
      });
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    if (id) {
      router.push('/app');
    }
  }, [id, router]);

  if (id) return null;

  return (
    <>
      <Meta page="Login" />

      <motion.section
        className="w-full h-screen grid place-items-center"
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        transition={{ duration: 0.5, delay, ease: 'anticipate' }}
      >
        <section className="border border-cloudy-500 bg-cloudy-600 w-[52rem] h-[37rem] rounded-xl p-8 flex flex-col">
          <h2 className="font-extrabold text-3xl text-center mb-2">New here?</h2>
          <p className="opacity-75 text-center mb-8">Welcome!</p>

          <section className="flex flex-grow gap-5 mb-3">
            <form onSubmit={onSignIn} className="flex flex-col justify-between flex-grow w-1/2">
              <section>
                <TextInput {...form.getInputProps('email')} label="EMAIL" className="mb-4" />
                <TextInput {...form.getInputProps('password')} label="PASSWORD" type="password" className="mb-3" />
                <TextInput {...form.getInputProps('confirm')} label="CONFIRM PASSWORD" type="password" className="mb-3" />
              </section>

              <Button classNames={{ root: bigButtonClass() }} type="submit" loading={loading}>Sign up</Button>
            </form>

            <section className="flex-grow w-1/2 flex flex-col">
              <h3 className="font-extrabold text-sm text-cloudy-300 mb-1">OR CONTINUE WITH</h3>

              <section className="flex flex-col gap-5 flex-grow">
                <Button classNames={{ root: bigButtonClass(null, true) }} onClick={() => firebaseClient.signInWithPopup('google')} className="bg-[#2B9DFF] hover:bg-[#237fcf] text-light-blue-200 flex-grow">
                  <FontAwesomeIcon icon={faGoogle} size="xl" />
                </Button>

                <Button classNames={{ root: bigButtonClass(null, true) }} onClick={() => firebaseClient.signInWithPopup('microsoft')} className="bg-[#7FBA00] hover:bg-[#679700] text-light-blue-200 flex-grow">
                  <FontAwesomeIcon icon={faMicrosoft} size="xl" />
                </Button>

                <Button classNames={{ root: bigButtonClass(null, true) }} onClick={() => firebaseClient.signInWithPopup('github')} className="bg-[#0e0e0e] hover:bg-[#000000] text-light-blue-200 flex-grow">
                  <FontAwesomeIcon icon={faGithub} size="xl" />
                </Button>
              </section>
            </section>
          </section>

          <p className="text-sm text-light-blue-600">Already have an account? <Link href="/login" className="text-light-blue-400 opacity-90 hover:opacity-100 hover:text-light-blue-200 transition-all duration-200 ease-in-out font-bold">Sign in</Link></p>
        </section>
      </motion.section>
    </>
  );
}

export const getServerSideProps = guestServerProps();