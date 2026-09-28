import { Cache } from './cache';

/**
 * A Map-backed `Cache`, holding nothing across a reload. It is the natural seam
 * default before a persistent driver is wired, and the fake the repository tests
 * run against.
 */
export class InMemoryCache implements Cache {
  private readonly store = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.store.get(key) as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}
