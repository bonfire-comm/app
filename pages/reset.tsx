import Meta from '@/components/Meta';
import { Button, TextInput } from '@mantine/core';
import Link from 'next/link';
import { motion } from 'framer-motion';
import useInternal from '@/lib/store';
import { useForm } from '@mantine/form';
import firebaseClient from '@/lib/firebase';
import { useCounter, useInterval, useToggle } from '@mantine/hooks';
import { useRouter } from 'next/router';
import useUser from '@/lib/store/user';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { showNotification } from '@mantine/notifications';
import showErrorNotification from '@/lib/helpers/showErrorNotification';
import Twemoji from '@/components/Twemoji';
import bigButtonClass from '@/lib/helpers/bigButtonClass';

export default function Reset() {
  const id = useUser((s) => s?.id);
  const router = useRouter();
  const [loading, setLoading] = useToggle();
  const delay = useInternal((state) => state.initialDelay);

  const [counter, counterOp] = useCounter(0, { max: 60, min: 0 });
  const timer = useInterval(() => {
    counterOp.decrement();
  }, 1_000);

  const [codeVerified, setCodeVerified] = useState(false);

  useEffect(() => {
    (async () => {
      const { oobCode } = router.query;

      if (oobCode) {
        const res = await firebaseClient.verifyPasswordResetCode(oobCode as string).catch(() => null);

        if (res) {
          setCodeVerified(true);
        }
      }
    })();
  }, [router.query]);

  const form = useForm({
    initialValues: {
      email: '',
    },
    validateInputOnChange: true,
    validate: {
      email: (value) => !z.string().email().safeParse(value).success && 'Invalid email',
    }
  });

  const send = form.onSubmit(async (values) => {
    setLoading(true);

    try {
      await firebaseClient.sendResetPasswordEmail(values.email);

      showNotification({
        title: <Twemoji>📤 Email sent!</Twemoji>,
        message: 'Check your inbox for a password reset link.',
        color: 'green',
      });

      counterOp.set(60);
      timer.start();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return form.setFieldError('email', 'User not found');
      }

      // eslint-disable-next-line no-console
      console.error(error);

      showErrorNotification({
        message: 'Something went wrong.',
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

  const resetForm = useForm({
    initialValues: {
      password: '',
      confirm: '',
    },
    validateInputOnChange: true,
    validate: {
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

  const resetPassword = resetForm.onSubmit(async (values) => {
    setLoading(true);

    try {
      await firebaseClient.changePassword(router.query.oobCode as string, values.password);

      showNotification({
        title: <Twemoji>✅ Password changed!</Twemoji>,
        message: 'Password changed successfully!',
        color: 'green',
      });

      router.push('/login');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return form.setFieldError('email', 'User not found');
      }

      // eslint-disable-next-line no-console
      console.error(error);

      showErrorNotification({
        message: 'Something went wrong.',
      });
    } finally {
      setLoading(false);
    }
  });

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
        <section className="border border-cloudy-500 bg-cloudy-600 min-w-[32rem] min-h-[24rem] rounded-xl p-8 flex flex-col">
          <h2 className="font-extrabold text-3xl text-center mb-2">Forgot your password?</h2>
          <p className="opacity-75 text-center mb-8">Let&apos;s get it sorted.</p>

          <section className="flex flex-grow gap-5 mb-3">
            {!codeVerified && (
              <form onSubmit={send} className="flex flex-col justify-between flex-grow w-1/2">
                <TextInput {...form.getInputProps('email')} label="EMAIL" className="mb-4" />

                <Button classNames={{ root: bigButtonClass() }} type="submit" disabled={counter !== 0} loading={loading}>Send {counter > 0 ? `(${counter})` : ''}</Button>
              </form>
            )}

            {codeVerified && (
              <form onSubmit={resetPassword} className="flex flex-col justify-between gap-[4rem] flex-grow w-1/2">
                <section>
                  <TextInput {...resetForm.getInputProps('password')} label="PASSWORD" type="password" className="mb-3" />
                  <TextInput {...resetForm.getInputProps('confirm')} label="CONFIRM PASSWORD" type="password" className="mb-3" />
                </section>

                <Button classNames={{ root: bigButtonClass() }} type="submit" loading={loading}>Submit</Button>
              </form>
            )}
          </section>

          <Link href="/login" className="text-sm text-light-blue-400 opacity-90 hover:opacity-100 hover:text-light-blue-200 transition-all duration-200 ease-in-out font-bold">Go back</Link>
        </section>
      </motion.section>
    </>
  );
}