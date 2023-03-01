import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import Message from '../classes/message';

const useMessageAction = create(combine({
  editing: false as boolean,
  message: null as Message | null,
  replying: false as boolean
}, (set) => ({
  setEditing: (editing: boolean) => set({ editing }),
  setMessage: (message: Message | null) => set({ message }),
  setReplying: (replying: boolean) => set({ replying })
})));

export default useMessageAction;