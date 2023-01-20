import EventEmitter from 'eventemitter3';

export type MapEvents<T, U> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set: (key: T, value: U) => void;
  delete: (key: T) => void;
  clear: () => void;

  changed: (key: T, value: U) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default class EventMap<T = any, U = any> extends Map<T, U> {
  readonly events = new EventEmitter<MapEvents<T, U>>();

  set(key: T, value: U) {
    super.set(key, value);

    this.events.emit('set', key, value);

    return this;
  }

  delete(key: T): boolean {
    const deleted = super.delete(key);

    if (deleted) {
      this.events.emit('delete', key);
    }

    return deleted;
  }

  clear() {
    super.clear();
    this.events.emit('clear');
  }
}