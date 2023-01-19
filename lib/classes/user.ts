import manager, { UserManager } from '../managers/user';

export default class User {
  id: string;

  discriminator: number;

  banner: string | null;

  about: string | null;

  badges: string[];

  createdAt: Date;

  image?: string;

  name: string;

  manager: UserManager;

  constructor(data: UserOptions) {
    this.id = data.id;
    this.discriminator = data.discriminator;
    this.banner = data.banner;
    this.about = data.about;
    this.badges = data.badges;
    this.createdAt = data.createdAt;
    this.image = data.image;
    this.name = data.name;

    this.manager = manager;
    this.manager.cache.set(this.id, this);
  }

  async fetch() {
    this.manager.fetch(this.id, true);
  }

  setData(data: UserOptions) {
    this.id = data.id;
    this.discriminator = data.discriminator;
    this.banner = data.banner;
    this.about = data.about;
    this.badges = data.badges;
    this.createdAt = data.createdAt;
    this.image = data.image;
    this.name = data.name;
  }
}