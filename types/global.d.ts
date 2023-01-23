import { Howl } from 'howler';
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

  type UserStatus = 'online' | 'idle' | 'offline';

  interface UserStatusData {
    status: UserStatus;
  }

  interface UserData {
    id: string;
    name: string | null;
    image: string;
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

  interface UserBuddies {
    added: string[];
    pending: string[];
    blocked: string[];
  }

  interface PlaylistData {
    name: string;
    file: string | string[];
    artist: string;
    link: string;
    player?: Howl;
  }

  type GetServerSidePropsWithUser<
    P extends { [key: string]: any } = { [key: string]: any },
    Q extends ParsedUrlQuery = ParsedUrlQuery
  > = (context: GetServerSidePropsContext<Q> & { user: UserData }) => Promise<GetServerSidePropsResult<P>>;

  type UserOptions = UserData & UserStatusData;
}