/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import authenticatedServerProps from '@/lib/helpers/authenticatedServerProps';
import { Button } from '@mantine/core';
import bigButtonClass from '@/lib/helpers/bigButtonClass';
import firebaseClient from '@/lib/firebase';
import { useRouter } from 'next/router';
import Meta from '@/components/Meta';
import { useEffect, useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { useInterval, useTimeout } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import Twemoji from '@/components/Twemoji';

export default function InvitePage() {
  const router = useRouter();

  const [sent, setSent] = useState(false);
  const [time, setTime] = useState(60);

  const timer = useInterval(() => setTime((t) => t - 1), 1000);
  const timeout = useTimeout(() => {
    setSent(false);
    timer.stop();
  }, 60_000);

  const send = async () => {
    if (!firebaseClient.auth.currentUser) return;

    try {
      await sendEmailVerification(firebaseClient.auth.currentUser);
      setSent(true);

      timer.start();
      timeout.start();

      showNotification({
        color: 'green',
        title: <Twemoji>✅ Sent</Twemoji>,
        message: 'Email sent.',
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);

      showNotification({
        color: 'red',
        title: <Twemoji>❌ Oops</Twemoji>,
        message: 'Something went wrong. Please try again later.',
      });
    }
  };

  const [codeVerified, setCodeVerified] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { oobCode } = router.query;

        if (oobCode) {
          const res = await firebaseClient.verifyEmailVerificationCode(oobCode as string).catch(() => null);

          if (res) {
            await firebaseClient.verifyEmail(oobCode as string);

            setCodeVerified(true);
          }
        }
      // eslint-disable-next-line no-empty
      } catch {}
    })();
  }, [router.query]);

  return (
    <>
      <Meta page="Verify Account" />

      <section className="w-screen h-screen grid place-items-center">
        <section className="border border-cloudy-500 bg-cloudy-600 p-6 pt-8 rounded-xl min-w-[24rem] max-w-[24rem] flex flex-col items-center">
          {!codeVerified && (
            <>
              <h1 className="text-2xl font-extrabold mb-2">Verify Account</h1>

              <p className="text-cloudy-300 mb-8">Please verify your email before proceeding.</p>

              <Button disabled={sent} onClick={send} className="w-full" classNames={{ root: bigButtonClass() }} type="submit">Send Email {sent ? `(${time})` : null}</Button>
            </>
          )}

          {codeVerified && (
            <>
              <h1 className="text-2xl font-extrabold mb-8">Account Verified</h1>

              <Button onClick={() => router.push('/app')} className="w-full" classNames={{ root: bigButtonClass() }} type="submit">Go to app</Button>
            </>
          )}
        </section>
      </section>
    </>
  );
}

export const getServerSideProps = authenticatedServerProps();

