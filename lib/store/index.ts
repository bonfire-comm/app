import { GLOBAL_DELAY } from '@/components/VideoBackground';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

const useInternal = create(combine({
  initialDelay: GLOBAL_DELAY,
  userLoaded: false,
  token: null as string | null,

  showParticipants: true,
}, (set) => ({
  setInitialDelay: (delay: number) => set({ initialDelay: delay }),
  setUserLoaded: (loaded: boolean) => set({ userLoaded: loaded }),
  setToken: (token: string | null) => set({ token }),
  setShowParticipants: (show: boolean) => set({ showParticipants: show }),
})));

export default useInternal;