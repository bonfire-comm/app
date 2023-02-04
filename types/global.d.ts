import Channel from '@/lib/classes/channel';
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
  }

  interface ChannelInviteData {
    id: string;
    uses: number;
    maxUses?: number;
    createdAt: Date;
    channelId: string;
    createdBy: string;
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

  interface EmbedData {
    author: string | null;
    description: string | null;
    image: string | null;
    logo: string | null;
    title: string | null;
    url: string | null;
    publisher?: string;
    color: string | null;
    audio?: string | null;
    date?: Date | null;
  }

  interface VoiceTokenPayload {
    token: string;
    permissions: ('allow_join' | 'allow_mod')[];
  }

  interface RoomData {
    roomId: string;
    customRoomId: string;
    userId: string;
    disabled: boolean;
    createdAt: string;
    updatedAt: string;
    id: string;
  }

  interface SessionParticipantData {
    participantId: string;
    name: string;
    timelog: ({
      start: string;
      end: string;
    })[];
  }

  interface SessionData {
    id: string;
    roomId: string;
    start: string; // ISO string
    end: string; // ISO string
    participants: SessionParticipantData[];
    status: 'ongoing' | 'ended';
  }

  type MeetingState = 'CONNECTING' | 'CONNECTED' | 'FAILED' | 'DISCONNECTED' | 'CLOSING' | 'CLOSED';

  type ChannelEventTypes = {
    'voice-token': (data: VoiceTokenPayload) => void;
    'voice-room-fetch': (data?: RoomData) => void;
    'voice-session-fetch': (data: SessionData | null) => void;
    changed: (channel: Channel) => void;
    message: (message: Message) => void;
    [k: `message-${string}`]: (message: Message) => void;
  };

  type GetServerSidePropsWithUser<
    P extends { [key: string]: any } = { [key: string]: any },
    Q extends ParsedUrlQuery = ParsedUrlQuery
  > = (context: GetServerSidePropsContext<Q> & { user: UserData }) => Promise<GetServerSidePropsResult<P>>;

  type UserOptions = UserData & UserStatusData;
}