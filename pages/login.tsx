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
import { useRouter } from 'next/router';
import useUser from '@/lib/store/user';
import { useEffect } from 'react';

export default function Login() {
  const uid = useUser((s) => s.uid);

  const router = useRouter();
  const [loading, setLoading] = useToggle();
  const delay = useInternal((state) => state.initialDelay);

  const form = useForm({
    initialValues: {
      email: '',
      password: ''
    }
  });

  const onSignIn = form.onSubmit(async (values) => {
    setLoading(true);

    try {
      await firebaseClient.signInWithEmailAndPassword(values.email, values.password);

      router.push('/app');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return form.setErrors({
          email: 'User not found',
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
    if (uid) {
      router.push('/app');
    }
  }, [uid, router]);

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
        <section className="border border-cloudy-500 bg-cloudy-600 w-[52rem] h-[32rem] rounded-xl p-8 flex flex-col">
          <h2 className="font-extrabold text-3xl text-center mb-2">Welcome back!</h2>
          <p className="opacity-75 text-center mb-8">Nice to see you again!</p>

          <section className="flex flex-grow gap-5 mb-3">
            <form onSubmit={onSignIn} className="flex flex-col justify-between flex-grow w-1/2">
              <section>
                <TextInput {...form.getInputProps('email')} required label="EMAIL" type="email" className="mb-4" />
                <TextInput {...form.getInputProps('password')} required label="PASSWORD" type="password" className="mb-3" />

                <Link href="/reset" className="font-semibold text-light-blue-600 hover:text-light-blue-500 transition-colors duration-200 ease-in-out text-sm">
                  Forgot password
                </Link>
              </section>

              <Button type="submit" loading={loading}>Sign in</Button>
            </form>

            <section className="flex-grow w-1/2 flex flex-col">
              <h3 className="font-extrabold text-sm text-cloudy-300 mb-1">OR CONTINUE WITH</h3>

              <section className="flex flex-col gap-5 flex-grow">
                <Button onClick={() => firebaseClient.signInWithPopup('google')} className="bg-[#2B9DFF] hover:bg-[#237fcf] text-light-blue-200 flex-grow">
                  <FontAwesomeIcon icon={faGoogle} size="xl" />
                </Button>

                <Button onClick={() => firebaseClient.signInWithPopup('microsoft')} className="bg-[#7FBA00] hover:bg-[#679700] text-light-blue-200 flex-grow">
                  <FontAwesomeIcon icon={faMicrosoft} size="xl" />
                </Button>

                <Button onClick={() => firebaseClient.signInWithPopup('github')} className="bg-[#0e0e0e] hover:bg-[#000000] text-light-blue-200 flex-grow">
                  <FontAwesomeIcon icon={faGithub} size="xl" />
                </Button>
              </section>
            </section>
          </section>

          <p className="text-sm text-light-blue-600">Don&apos;t have an account? <Link href="/register" className="text-light-blue-400 opacity-90 hover:opacity-100 hover:text-light-blue-200 transition-all duration-200 ease-in-out font-bold">Sign up</Link></p>
        </section>
      </motion.section>
    </>
  );
}