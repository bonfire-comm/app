import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { Meeting } from '@videosdk.live/js-sdk/meeting';
import { VideoSDK } from '@videosdk.live/js-sdk';

const useVoice = create(
  combine({
    room: null as RoomData | null,
    ongoingSession: null as SessionData | null,
    meeting: null as Meeting | null,
    SDK: null as typeof VideoSDK | null,
    activeChannelId: null as string | null,

    deafened: false,
    muted: false,
    video: false,
    screen: false,
    state: 'CONNECTING' as MeetingState,
    activeTalker: null as string | null,
  }, (set) => ({
    setRoom: (room: RoomData | null) => set({ room }),
    setOngoingSession: (session: SessionData | null) => set({ ongoingSession: session }),
    setMeeting: (meeting: Meeting | null) => set({ meeting }),
    setSDK: (SDK: typeof VideoSDK | null) => set({ SDK }),
    setDeafened: (deafened: boolean) => set({ deafened }),
  }))
);

export default useVoice;