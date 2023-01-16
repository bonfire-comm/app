import { GLOBAL_DELAY } from '@/components/VideoBackground';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

const useInternal = create(combine({
  initialDelay: GLOBAL_DELAY,
  userLoaded: false,
}, (set) => ({
  setInitialDelay: (delay: number) => set({ initialDelay: delay }),
  setUserLoaded: (loaded: boolean) => set({ userLoaded: loaded }),
})));

export default useInternal;