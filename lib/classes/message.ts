import { ref, remove, update } from 'firebase/database';
import { omitBy, pick } from 'lodash-es';
import BaseStruct from './base';
import type Channel from './channel';
import firebaseClient from '../firebase';

export default class Message extends BaseStruct implements ChannelMessageData {
  id: string;

  author: string;

  content: string;

  createdAt: Date;

  editedAt?: Date | null = null;

  attachments?: ChannelMessageAttachmentData[] | null = null;

  readonly channel: Channel;

  constructor(data: ChannelMessageData, channel: Channel) {
    super();

    this.id = data.id;
    this.author = data.author;
    this.content = data.content;
    this.createdAt = data.createdAt;
    this.editedAt = data.editedAt;
    this.attachments = data.attachments;

    this.channel = channel;
  }

  async delete() {
    const dataRef = ref(firebaseClient.rtdb, `channels/${this.channel.id}/messages/${this.id}`);
    await remove(dataRef);
  }

  set(data: Partial<ChannelMessageData>) {
    if (data.author !== undefined) this.author = data.author;
    if (data.content !== undefined) this.content = data.content;
    if (data.createdAt !== undefined) this.createdAt = data.createdAt;
    if (data.editedAt !== undefined) this.editedAt = data.editedAt;
    if (data.attachments !== undefined) this.attachments = data.attachments;

    return this;
  }

  async commit(edit = false) {
    if (edit) {
      this.editedAt = new Date();
      this.channel.events.emit('message', this);
    }

    const dataRef = ref(firebaseClient.rtdb, `channels/${this.channel.id}/messages/${this.id}`);
    await update(dataRef, {
      author: this.author,
      content: this.content,
      attachments: this.attachments ?? null,
      createdAt: this.createdAt.getTime(),
      editedAt: this.editedAt?.getTime() ?? null,
    });
  }

  get pinned() {
    return this.channel.pins.includes(this.id);
  }

  copy() {
    return new Message(this, this.channel);
  }

  toJSON() {
    return omitBy(
      pick<ChannelMessageData>(this, ['id', 'author', 'content', 'createdAt', 'editedAt', 'attachments']),
      (value) => value === undefined || value === null || (Array.isArray(value) && value.length === 0)
    );
  }
}