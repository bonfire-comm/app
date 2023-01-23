import EventEmitter from 'eventemitter3';
import type UserManager from '../managers/user';
import BaseStruct from './base';

export type UserEventTypes = {
  // eslint-disable-next-line no-use-before-define
  changed: (user: User) => void;
};

export default class User extends BaseStruct implements UserOptions {
  id: string;

  discriminator: number;

  banner?: string | null;

  about?: string | null;

  badges: string[];

  createdAt: Date;

  status: UserStatus;

  activity: { text: string; emoji?: string | undefined } | null;

  image: string;

  name: string | null;

  readonly manager: UserManager;

  readonly events = new EventEmitter<UserEventTypes>();

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

  emitChanged() {
    this.manager.cache.events.emit('changed', this.id, this);
    this.events.emit('changed', this);
  }

  // write all setters methods
  setId(id: string) {
    this.id = id;

    this.emitChanged();

    return this;
  }

  setDiscriminator(discriminator: number) {
    this.discriminator = discriminator;

    this.emitChanged();

    return this;
  }

  setBanner(banner: string | null) {
    this.banner = banner;

    this.emitChanged();

    return this;
  }

  setAbout(about: string | null) {
    this.about = about;

    this.emitChanged();

    return this;
  }

  setBadges(badges: string[]) {
    this.badges = badges;

    this.emitChanged();

    return this;
  }

  setCreatedAt(createdAt: Date | string | number) {
    this.createdAt = new Date(createdAt);

    this.emitChanged();

    return this;
  }

  setImage(image: string) {
    this.image = image;

    this.emitChanged();

    return this;
  }

  setName(name: string | null) {
    this.name = name;

    this.emitChanged();

    return this;
  }

  setStatus(status: UserStatus) {
    this.status = status;

    this.emitChanged();

    return this;
  }

  setActivity(activity: { text: string; emoji?: string | undefined } | null) {
    this.activity = activity;

    this.emitChanged();

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

    this.emitChanged();
  }

  copy() {
    return new User(this, this.manager);
  }
}