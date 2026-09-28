import { Injectable } from '@angular/core';
import { Drivers } from '@ionic/storage';
import { Storage } from '@ionic/storage-angular';
import { Cache } from './cache';

/** The dedicated store the data cache lives in, kept apart from Favourites. */
const DATA_CACHE_STORE = 'data-cache';

/**
 * The persistent `Cache`, backed by Ionic Storage (IndexedDB on web/native), so
 * fetched reference data survives an app reopen. It uses its own store, so a
 * `clear()` on a version mismatch never touches the separate Favourites store.
 * The underlying database is created lazily on first use.
 */
@Injectable({ providedIn: 'root' })
export class IonicStorageCache implements Cache {
  private readonly storage = new Storage({
    name: 'pokedex',
    storeName: DATA_CACHE_STORE,
    driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage],
  });
  private ready: Promise<Storage> | null = null;

  private open(): Promise<Storage> {
    return (this.ready ??= this.storage.create());
  }

  async get<T>(key: string): Promise<T | undefined> {
    const db = await this.open();
    return (await db.get(key)) ?? undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const db = await this.open();
    await db.set(key, value);
  }

  async clear(): Promise<void> {
    const db = await this.open();
    await db.clear();
  }
}
