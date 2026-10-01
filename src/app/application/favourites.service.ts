import { Injectable, computed, inject, signal } from '@angular/core';
import { FavouriteEntry } from '../domain/favourite-entry';
import { PokemonTypeName } from '../domain/pokemon-type-name';
import { FAVOURITES_STORE } from '../data/favourites/favourites-store';
import { matchesQuery } from './matches-query';

/** Lifecycle of reading the saved set from the store on first use. */
export type FavouritesStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * The Trainer's Favourites, the single source of truth for what is saved and
 * whether a given Pokémon is in the set. Reads on first use, then keeps the set
 * in a signal so Browse, Detail and the Favourites tab all react to a toggle.
 * A toggle is optimistic and reverts on a store-write failure.
 */
@Injectable({ providedIn: 'root' })
export class FavouritesService {
  private readonly store = inject(FAVOURITES_STORE);

  private readonly _entries = signal<FavouriteEntry[]>([]);
  private readonly _status = signal<FavouritesStatus>('idle');

  /** The saved entries, oldest first. */
  readonly entries = this._entries.asReadonly();
  /** Read state, so the tab can show its own error + Retry on a read failure. */
  readonly status = this._status.asReadonly();
  /** True once the store's saved set is in memory, so the heart matches what's stored. */
  readonly ready = computed(() => this._status() === 'ready');

  private loading: Promise<void> | null = null;

  /**
   * Reads the saved set the first time it's needed, and keeps that read for the
   * app's lifetime. Concurrent callers share one in-flight promise.
   */
  load(): Promise<void> {
    if (this._status() === 'ready') {
      return Promise.resolve();
    }
    if (this.loading) {
      return this.loading;
    }
    this._status.set('loading');
    this.loading = this.store
      .readAll()
      .then((entries) => {
        this._entries.set(entries);
        this._status.set('ready');
      })
      .catch(() => {
        this._status.set('error');
      })
      .finally(() => {
        this.loading = null;
      });
    return this.loading;
  }

  /** Retries the initial read after a store-read failure. */
  retry(): Promise<void> {
    this._status.set('idle');
    return this.load();
  }

  /** True when the given entry id is currently saved. */
  isFavourite(id: number): boolean {
    return this._entries().some((entry) => entry.id === id);
  }

  /**
   * The saved entries that have the given Type in either slot. It reads the
   * Types stored with each Favourite, so filtering never fetches.
   */
  byType(type: PokemonTypeName): FavouriteEntry[] {
    return this._entries().filter((entry) => entry.types.includes(type));
  }

  /**
   * The saved entries whose name or number matches the text. It only looks at
   * the saved set, and a blank query leaves the whole set in place.
   */
  search(text: string): FavouriteEntry[] {
    if (text.trim().length === 0) {
      return this._entries();
    }
    return this._entries().filter((entry) => matchesQuery(entry, text));
  }

  /**
   * Adds the entry if missing, removes it if present. The change is optimistic,
   * the signal flips first, then persists; a write failure rolls the signal back
   * so the heart on Detail reflects what's actually stored. Refuses when the
   * initial read hasn't landed yet, so a toggle can never overwrite a saved set
   * that was there but we haven't seen.
   */
  async toggle(entry: FavouriteEntry): Promise<boolean> {
    if (!this.ready()) {
      await this.load();
    }
    if (!this.ready()) {
      return false;
    }
    const before = this._entries();
    const isOn = before.some((saved) => saved.id === entry.id);
    const after = isOn ? before.filter((saved) => saved.id !== entry.id) : [...before, entry];
    this._entries.set(after);
    try {
      await this.store.writeAll(after);
      return true;
    } catch {
      this._entries.set(before);
      return false;
    }
  }
}
