import { Injectable, computed, inject, signal } from '@angular/core';
import { PokemonSummary } from '../domain/pokemon-summary';
import { PokemonTypeName } from '../domain/pokemon-type-name';
import { PokemonRepository, TypeIndex } from '../data/repository/pokemon.repository';
import { matchesQuery } from './matches-query';

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

  private readonly _typeIndex = signal<TypeIndex>(new Map());
  private readonly _typesReady = signal(false);
  private typesInFlight: Promise<void> | null = null;

  /** True once the background Type warm-up has folded the 18 sets into the map. */
  readonly typesReady = this._typesReady.asReadonly();

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
   * Kicks the background Type warm up that colours the Browse cards. Runs off
   * the scroll path (fires after the first Browse page lands), folds the 18
   * cached Type sets into the id to Types map, and flips typesReady when the
   * map is in place. Idempotent, concurrent callers share one warm-up.
   */
  warmUpTypes(): Promise<void> {
    if (this._typesReady()) {
      return Promise.resolve();
    }
    if (this.typesInFlight) {
      return this.typesInFlight;
    }
    this.typesInFlight = this.repository
      .getTypeIndex()
      .then((index) => {
        this._typeIndex.set(index);
        this._typesReady.set(true);
      })
      .catch(() => {
        // A failed warm-up leaves cards neutral tinted, the Type filter will
        // still fetch each set on demand and populate the map for reuse.
      })
      .finally(() => {
        this.typesInFlight = null;
      });
    return this.typesInFlight;
  }

  /**
   * Looks up an entry id's Types from the warmed map, primary Type first.
   * Returns undefined until the warm-up completes for that id, which the
   * card renders as a neutral tint until the map fills.
   */
  typesOf(id: number): PokemonTypeName[] | undefined {
    return this._typeIndex().get(id);
  }

  /**
   * Partial match over the loaded index. A query is compared against both the
   * title cased name (case insensitive substring) and the entry id, matching by
   * substring.
   */
  search(text: string): PokemonSummary[] {
    if (text.trim().length === 0) {
      return [];
    }
    return this._items().filter((item) => matchesQuery(item, text));
  }
}
