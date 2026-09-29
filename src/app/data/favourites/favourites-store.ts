import { InjectionToken } from '@angular/core';
import { FavouriteEntry } from '../../domain/favourite-entry';

/**
 * The Favourites persistence seam. Lives in a store of its own so a data-cache
 * version-clear never touches the Trainer's saved set. The methods are async so
 * the backing store can be swapped, an in-memory fake for tests, Ionic Storage
 * (IndexedDB) at runtime, without any caller change.
 */
export interface FavouritesStore {
  /** Reads every saved entry, in the order they were added. */
  readAll(): Promise<FavouriteEntry[]>;
  /** Writes the whole saved set, overwriting the previous one. */
  writeAll(entries: FavouriteEntry[]): Promise<void>;
}

/** DI token for the Favourites store, so callers depend on the seam. */
export const FAVOURITES_STORE = new InjectionToken<FavouritesStore>('FAVOURITES_STORE');
