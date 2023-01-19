// eslint-disable-next-line import/no-cycle
import { CookieManagerRequestData, CookieManagerSetOptions } from '@/components/TokenCookieProvider';
import fetcher from '../api/fetcher';

export default class CookieSetterBuilder {
  public data: CookieManagerRequestData = {};

  constructor(data?: CookieManagerRequestData) {
    if (data) {
      this.data = data;
    }
  }

  set(name: string, value: string, options?: CookieManagerSetOptions) {
    if (!this.data.set) {
      this.data.set = {};
    }

    this.data.set[name] = { value, options };

    return this;
  }

  /**
   * @param name Cookie name (use `name:path` to specify path)
   */
  remove(name: string) {
    if (!this.data.remove) {
      this.data.remove = [];
    }

    this.data.remove.push(name);

    return this;
  }

  deleteSetEntry(name: string) {
    if (this.data.set) {
      delete this.data.set[name];
    }

    return this;
  }

  deleteRemoveEntry(name: string) {
    if (this.data.remove) {
      this.data.remove = this.data.remove.filter((n) => n !== name);
    }

    return this;
  }

  build() {
    return Object.freeze(this.data);
  }

  commit() {
    return fetcher<SemanticResponse<CookieManagerRequestData>>('/cookie', {
      method: 'POST',
      data: this.build()
    });
  }
}