import { User } from 'firebase/auth';
import { create } from 'zustand';

const useUser = create<Partial<User>>(() => ({}));

export default useUser;