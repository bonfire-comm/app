import firebaseClient from '@/lib/firebase';
import { useInterval } from '@mantine/hooks';
import { ReactNode, useEffect } from 'react';
import { z } from 'zod';

export const cookieSetOptionsValidator = z.object({
  expires: z.date().optional(),
  httpOnly: z.boolean().optional(),
  maxAge: z.number().optional(),
  path: z.string().optional(),
  sameSite: z.boolean().optional(),
  secure: z.boolean().optional(),
}).optional();


export const cookieManagerValidator = z.object({
  set: z.record(z.string(), z.object({
    value: z.string(),
    options: cookieSetOptionsValidator,
  })).optional(),
  remove: z.array(z.string()).optional(),
});

export type CookieManagerRequestData = typeof cookieManagerValidator['_input'];
export type CookieManagerSetOptions = typeof cookieSetOptionsValidator['_input'];

export default function TokenCookieProvider({ children }: { children: ReactNode }) {
  const interval = useInterval(() => firebaseClient.auth.currentUser?.getIdToken(true), 30 * 60 * 1000);

  useEffect(() => {
    interval.start();

    const unsub = firebaseClient.auth.onIdTokenChanged((user) => firebaseClient.generateToken(user));

    return () => {
      unsub();
      interval.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}