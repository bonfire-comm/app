import { User } from 'firebase/auth';
import { create } from 'zustand';

const useUser = create<Partial<User & Omit<UserData, 'name' | 'image'>>>(() => ({}));

export default useUser;