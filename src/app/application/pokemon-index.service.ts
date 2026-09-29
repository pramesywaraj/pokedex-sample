import { Injectable, computed, inject, signal } from '@angular/core';
import { PokemonSummary } from '../domain/pokemon-summary';
import { PokemonRepository } from '../data/repository/pokemon.repository';

/** Neighbour ids either side of a position, missing at the ends of the list. */
export interface Neighbours {
  prev?: number;
  next?: number;
}

/**
 * Holds the phonebook index for the whole app. Loaded once at startup via the
 * repository (count then fetch pokemons), it backs partial match search from the search
 * bar and the prev/next neighbours the detail swipe navigation will use later.
 * The load is idempotent, callers can trigger it again after a failure and it
 * simply retries.
 */
@Injectable({ providedIn: 'root' })
export class PokemonIndexService {
  private readonly repository = inject(PokemonRepository);

  private readonly _items = signal<PokemonSummary[]>([]);
  private readonly _ready = signal(false);
  private readonly _loading = signal(false);
  private readonly _error = signal(false);

  /** Every entry in list order, empty until the index has loaded. */
  readonly items = this._items.asReadonly();
  /** True once the phone book is loaded and ready for search and neighbours. */
  readonly ready = this._ready.asReadonly();
  /** True while the initial or retry fetch is in flight. */
  readonly loading = this._loading.asReadonly();
  /** True when the fetch failed and the search bar needs to show unavailable. */
  readonly error = this._error.asReadonly();

  /** Cheap flag for the search bar's disabled+hint state before the index lands. */
  readonly disabled = computed(() => !this._ready() || this._error());

  /** Position of an entry id in list order, or undefined if it isn't in the index. */
  private positions = new Map<number, number>();

  /**
   * Loads the index if it hasn't loaded yet, otherwise returns straight away.
   * Concurrent callers await the same in-flight promise so we never fire two
   * count then fetch loads at once.
   */
  private inFlight: Promise<void> | null = null;

  load(): Promise<void> {
    if (this._ready()) {
      return Promise.resolve();
    }
    if (this.inFlight) {
      return this.inFlight;
    }
    this._loading.set(true);
    this._error.set(false);
    this.inFlight = this.repository
      .getIndex()
      .then((items) => {
        this._items.set(items);
        this.positions = new Map(items.map((item, position) => [item.id, position]));
        this._ready.set(true);
      })
      .catch(() => {
        this._error.set(true);
      })
      .finally(() => {
        this._loading.set(false);
        this.inFlight = null;
      });
    return this.inFlight;
  }

  /** Kicks the load again after a failure, from the search bar's retry action. */
  retry(): Promise<void> {
    return this.load();
  }

  /** Position of an entry id in list order. */
  positionOf(id: number): number | undefined {
    return this.positions.get(id);
  }

  /** The entries either side of the given id in list order, or undefined at the ends. */
  neighbours(id: number): Neighbours {
    const position = this.positions.get(id);
    if (position === undefined) {
      return {};
    }
    const items = this._items();
    return {
      prev: position > 0 ? items[position - 1].id : undefined,
      next: position < items.length - 1 ? items[position + 1].id : undefined,
    };
  }

  /**
   * Partial match over the loaded index. A query is compared against both the
   * title cased name (case insensitive substring) and the entry id, matching by
   * substring.
   */
  search(text: string): PokemonSummary[] {
    const query = text.trim().toLowerCase();
    if (query.length === 0) {
      return [];
    }
    return this._items().filter(
      (item) =>
        item.name.toLowerCase().includes(query) || String(item.id).includes(query),
    );
  }
}
