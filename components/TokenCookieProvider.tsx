import firebaseClient from '@/lib/firebase';
// eslint-disable-next-line import/no-cycle
import CookieSetterBuilder from '@/lib/managers/cookie';
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
  useEffect(() =>
    firebaseClient.auth.onIdTokenChanged(async (user) => {
      const builder = new CookieSetterBuilder();

      if (!user) {
        builder.remove('token:/');
      } else {
        const token = await user.getIdToken();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        builder.set('token', token, {
          httpOnly: true,
          path: '/'
        });
      }

      await builder.commit();
    })
  , []);

  // Refresh token every 15 minutes
  useInterval(() => firebaseClient.auth.currentUser?.getIdToken(true), 15 * 60 * 1000);

  return <>{children}</>;
}