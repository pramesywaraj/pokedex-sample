import { Injectable } from '@angular/core';
import { Drivers } from '@ionic/storage';
import { Storage } from '@ionic/storage-angular';
import { FavouriteEntry } from '../../domain/favourite-entry';
import { FavouritesStore } from './favourites-store';

/** The dedicated store Favourites live in, kept apart from the data cache. */
const FAVOURITES_STORE_NAME = 'favourites';
/** The single key the saved set is stored under. */
const FAVOURITES_KEY = 'entries';

/**
 * The persistent `FavouritesStore`, backed by Ionic Storage (IndexedDB on
 * web/native). It uses its own store, so a data-cache version-clear can never
 * touch what the Trainer saved. The database opens lazily on first use.
 */
@Injectable({ providedIn: 'root' })
export class IonicStorageFavouritesStore implements FavouritesStore {
  private readonly storage = new Storage({
    name: 'pokedex',
    storeName: FAVOURITES_STORE_NAME,
    driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage],
  });
  private ready: Promise<Storage> | null = null;

  private open(): Promise<Storage> {
    return (this.ready ??= this.storage.create());
  }

  async readAll(): Promise<FavouriteEntry[]> {
    const db = await this.open();
    return (await db.get(FAVOURITES_KEY)) ?? [];
  }

  async writeAll(entries: FavouriteEntry[]): Promise<void> {
    const db = await this.open();
    await db.set(FAVOURITES_KEY, entries);
  }
}
