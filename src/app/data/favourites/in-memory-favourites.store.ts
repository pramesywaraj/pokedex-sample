import { FavouriteEntry } from '../../domain/favourite-entry';
import { FavouritesStore } from './favourites-store';

/**
 * A field-backed store, holding nothing across a reload. It is the default fake
 * the service tests run against, and the seam's baseline before a persistent
 * driver is wired.
 */
export class InMemoryFavouritesStore implements FavouritesStore {
  private entries: FavouriteEntry[] = [];

  async readAll(): Promise<FavouriteEntry[]> {
    return [...this.entries];
  }

  async writeAll(entries: FavouriteEntry[]): Promise<void> {
    this.entries = [...entries];
  }
}
