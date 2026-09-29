import { Injectable, inject, signal } from '@angular/core';
import { PokemonSummary } from '../domain/pokemon-summary';
import { PokemonIndexService } from './pokemon-index.service';
import { BrowsePokemonSource } from './sources/browse.source';
import { PokemonSource } from './sources/pokemon-source';
import { SearchPokemonSource } from './sources/search.source';

/** First load lifecycle of the grid, per mode. */
export type FeedStatus = 'loading' | 'ready' | 'empty' | 'error';

/** Which loader is feeding the grid. */
export type FeedMode = 'browse' | 'search';

/**
 * Powers the Browse grid, holds the loaded summaries and the per-state signals a
 * screen renders from, delegating paging to a PokemonSource. Two modes today,
 * network-paged browse and client-paged search over the loaded index, swapped
 * behind the same interface.
 */
@Injectable({ providedIn: 'root' })
export class FeedService {
  private readonly browseSource = inject(BrowsePokemonSource);
  private readonly searchSource = inject(SearchPokemonSource);
  private readonly index = inject(PokemonIndexService);

  private readonly _items = signal<PokemonSummary[]>([]);
  private readonly _status = signal<FeedStatus>('loading');
  private readonly _loadingMore = signal(false);
  private readonly _loadMoreError = signal(false);
  private readonly _hasMore = signal(true);
  private readonly _mode = signal<FeedMode>('browse');
  private readonly _query = signal('');
  private inFlight = false;
  private source: PokemonSource = this.browseSource;

  /** The summaries loaded so far, in list order. */
  readonly items = this._items.asReadonly();
  /** First-load state for the current mode. */
  readonly status = this._status.asReadonly();
  /** True while appending a later page, drives the bottom spinner. */
  readonly loadingMore = this._loadingMore.asReadonly();
  /** True when a later page failed, drives the inline "couldn't load more" retry. */
  readonly loadMoreError = this._loadMoreError.asReadonly();
  /** Whether more pages remain, drives whether infinite scroll stays enabled. */
  readonly hasMore = this._hasMore.asReadonly();
  /** Which loader is active, so the page can pick the right empty-state copy. */
  readonly mode = this._mode.asReadonly();
  /** The trimmed query driving search mode, empty in browse mode. */
  readonly query = this._query.asReadonly();

  /**
   * Loads the next page from the active source. The first call drives the
   * skeleton, grid, error lifecycle for that mode, later calls append and
   * surface the bottom spinner or an inline retry.
   */
  async loadNext(): Promise<void> {
    if (this.inFlight || (!this._hasMore() && this._items().length > 0)) {
      return;
    }
    const isFirst = this._items().length === 0;
    this.inFlight = true;
    if (isFirst) {
      this._status.set('loading');
    } else {
      this._loadingMore.set(true);
    }
    this._loadMoreError.set(false);
    try {
      const page = await this.source.loadNext();
      this._items.update((current) => [...current, ...page.items]);
      this._hasMore.set(page.hasMore);
      this._status.set(this._items().length === 0 ? 'empty' : 'ready');
    } catch {
      if (isFirst) {
        this._status.set('error');
      } else {
        this._loadMoreError.set(true);
      }
    } finally {
      this.inFlight = false;
      this._loadingMore.set(false);
    }
  }

  /**
   * Switches to browse mode and clears any active search. Safe to call when
   * already in browse mode, only re-seeds the grid if it isn't already loaded.
   */
  showBrowse(): Promise<void> {
    this._query.set('');
    if (this._mode() === 'browse' && this._items().length > 0) {
      return Promise.resolve();
    }
    this.browseSource.reset();
    this.source = this.browseSource;
    this._mode.set('browse');
    this.resetGrid();
    return this.loadNext();
  }

  /**
   * Enters search mode for a query. An empty query is treated as clearing the
   * search and returning to browse. Matches come from the pre-loaded phonebook
   * index, so this needs no network work, empty results settle as an "empty"
   * status which the page renders as "No matches".
   */
  showSearch(query: string): Promise<void> {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      return this.showBrowse();
    }
    this._query.set(trimmed);
    this._mode.set('search');
    this.searchSource.setResults(this.index.search(trimmed));
    this.source = this.searchSource;
    this.resetGrid();
    return this.loadNext();
  }

  private resetGrid(): void {
    this._items.set([]);
    this._hasMore.set(true);
    this._loadMoreError.set(false);
    this._status.set('loading');
  }
}
