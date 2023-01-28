import Message from '@/lib/classes/message';
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
    image: string;
  }

  interface ChannelVoiceData {
    id?: string;
    started: boolean;
    participants: [];
  }

  interface ChannelData {
    id: string;
    name: string;
    image?: string;
    isDM: boolean;
    owner?: string;
    description?: string;
    participants: Record<string, boolean>;
    pins: string[];
    createdAt: Date;
    bans: Record<string, boolean>;

    voice: ChannelVoiceData;
  }

  interface ChannelMessageAttachmentData {
    name: string;
    url: string;
    id: string;
    type: string;
  }

  interface ChannelMessageData {
    id: string;
    author: string;
    content: string;
    createdAt: Date;
    editedAt?: Date | null;
    attachments?: ChannelMessageAttachmentData[] | null;
  }

  type ChannelEventTypes = {
    message: (message: Message) => void;
    [k: `message-${string}`]: (message: Message) => void;
  };

  type GetServerSidePropsWithUser<
    P extends { [key: string]: any } = { [key: string]: any },
    Q extends ParsedUrlQuery = ParsedUrlQuery
  > = (context: GetServerSidePropsContext<Q> & { user: UserData }) => Promise<GetServerSidePropsResult<P>>;

  type UserOptions = UserData & UserStatusData;
}