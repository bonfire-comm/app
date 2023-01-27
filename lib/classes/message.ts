import { ref, remove, set } from 'firebase/database';
import { pick } from 'lodash-es';
import BaseStruct from './base';
import type Channel from './channel';
import firebaseClient from '../firebase';

export default class Message extends BaseStruct implements ChannelMessageData {
  id: string;

  author: string;

  content: string;

  createdAt: Date;

  editedAt?: Date | undefined;

  attachments?: ChannelMessageAttachmentData[];

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
    await set(dataRef, pick<ChannelMessageData>(this, ['author', 'content', 'createdAt', 'editedAt', 'attachments']));
  }

  copy() {
    return new Message(this, this.channel);
  }
}