import type UserManager from '../managers/user';
import BaseStruct from './base';

export default class User extends BaseStruct implements UserOptions {
  id: string;

  discriminator: number;

  banner?: string | null;

  about?: string | null;

  badges: string[];

  createdAt: Date;

  status: 'online' | 'idle' | 'dnd' | 'offline';

  activity: { text: string; emoji?: string | undefined } | null;

  image?: string | null;

  name: string | null;

  readonly manager: UserManager;

  constructor(data: UserOptions, manager: UserManager) {
    super();

    this.id = data.id;
    this.discriminator = data.discriminator;
    this.banner = data.banner;
    this.about = data.about;
    this.badges = data.badges;
    this.createdAt = data.createdAt;
    this.image = data.image;
    this.name = data.name;
    this.status = data.status;
    this.activity = data.activity;

    this.manager = manager;
    this.manager.cache.set(this.id, this);
  }

  async fetch() {
    this.manager.fetch(this.id, true);
  }

  // write all setters methods
  setId(id: string) {
    this.id = id;

    this.manager.cache.events.emit('changed', this.id, this);

    return this;
  }

  setDiscriminator(discriminator: number) {
    this.discriminator = discriminator;

    this.manager.cache.events.emit('changed', this.id, this);

    return this;
  }

  setBanner(banner: string | null) {
    this.banner = banner;

    this.manager.cache.events.emit('changed', this.id, this);

    return this;
  }

  setAbout(about: string | null) {
    this.about = about;

    this.manager.cache.events.emit('changed', this.id, this);

    return this;
  }

  setBadges(badges: string[]) {
    this.badges = badges;

    this.manager.cache.events.emit('changed', this.id, this);

    return this;
  }

  setCreatedAt(createdAt: Date | string | number) {
    this.createdAt = new Date(createdAt);

    this.manager.cache.events.emit('changed', this.id, this);

    return this;
  }

  setImage(image: string | null) {
    this.image = image;

    this.manager.cache.events.emit('changed', this.id, this);

    return this;
  }

  setName(name: string | null) {
    this.name = name;

    this.manager.cache.events.emit('changed', this.id, this);

    return this;
  }

  setStatus(status: 'online' | 'idle' | 'dnd' | 'offline') {
    this.status = status;

    this.manager.cache.events.emit('changed', this.id, this);

    return this;
  }

  setActivity(activity: { text: string; emoji?: string | undefined } | null) {
    this.activity = activity;

    this.manager.cache.events.emit('changed', this.id, this);

    return this;
  }

  set(data: UserData) {
    this.id = data.id;
    this.discriminator = data.discriminator;
    this.banner = data.banner;
    this.about = data.about;
    this.badges = data.badges;
    this.createdAt = data.createdAt;
    this.image = data.image;
    this.name = data.name;
    this.activity = data.activity;

    this.manager.cache.events.emit('changed', this.id, this);
  }

  copy() {
    return new User(this, this.manager);
  }
}