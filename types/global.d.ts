import { UserRecord } from 'firebase-admin/lib/auth/user-record';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { ParsedUrlQuery } from 'querystring';

/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface SemanticResponse<T = any> {
    message?: string;
    code?: string;
    payload?: T;
    errors?: any;
  }

  type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

  interface UserStatusData {
    status: UserStatus;
  }

  interface UserData {
    id: string;
    name: string | null;
    image?: string | null;
    discriminator: number;
    banner?: string | null;
    about?: string | null;
    badges: string[];
    createdAt: Date;
    activity: {
      text: string;
      emoji?: string;
    } | null;
  }

  type GetServerSidePropsWithUser<
    P extends { [key: string]: any } = { [key: string]: any },
    Q extends ParsedUrlQuery = ParsedUrlQuery
  > = (context: GetServerSidePropsContext<Q> & { user: UserRecord}) => Promise<GetServerSidePropsResult<P>>;

  type UserOptions = UserData & UserStatusData;
}