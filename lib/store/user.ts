import { create } from 'zustand';
import User from '../classes/user';

const useUser = create<User | null>(() => null);

export default useUser;