import fetcher from '../api/fetcher';
import User from '../classes/user';

export class UserManager {
  readonly cache = new Map<string, User>();

  async fetch(id: string, force = false) {
    if (!force && this.cache.has(id)) {
      return this.cache.get(id);
    }

    const res = await fetcher<SemanticResponse<UserOptions>>(`/users/${id}`).catch(() => null);
    if (!res) return;

    const instance = this.cache.get(id);
    if (instance) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      instance.setData(res.data.payload!);
      return instance;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const user = new User(res.data.payload!);
    this.cache.set(id, user);

    return user;
  }
}

const userManager = new UserManager();

export default userManager;