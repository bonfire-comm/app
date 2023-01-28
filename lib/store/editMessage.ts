import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import Message from '../classes/message';

const useEditMessage = create(combine({
  editing: false as boolean,
  message: null as Message | null
}, (set) => ({
  setEditing: (editing: boolean) => set({ editing }),
  setMessage: (message: Message | null) => set({ message })
})));

export default useEditMessage;