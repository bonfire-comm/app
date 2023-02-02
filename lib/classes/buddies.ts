import { clone } from 'lodash-es';
import firebaseClient from '../firebase';
import BaseStruct from './base';

export default class Buddies extends BaseStruct implements UserBuddies {
  added: string[];

  pending: string[];

  blocked: string[];

  constructor(data: UserBuddies) {
    super();

    this.added = data.added;
    this.pending = data.pending;
    this.blocked = data.blocked;

    this.fetchUsers();
  }

  async fetchUsers() {
    const users = [...this.added, ...this.pending, ...this.blocked];

    await Promise.all(users.map(async (id) => {
      const user = await firebaseClient.managers.user.fetch(id);

      return user;
    }));
  }

  copy() {
    return clone(this);
  }
}