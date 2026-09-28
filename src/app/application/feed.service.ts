import { Injectable, inject, signal } from '@angular/core';
import { PokemonSummary } from '../domain/pokemon-summary';
import { BrowsePokemonSource } from './sources/browse.source';

/** First load lifecycle of the Browse grid. */
export type FeedStatus = 'loading' | 'ready' | 'empty' | 'error';

/**
 * Powers the Browse grid, holds the loaded summaries and the per-state signals a
 * screen renders from, delegating paging to a PokemonSource.
 */
@Injectable({ providedIn: 'root' })
export class FeedService {
  private readonly source = inject(BrowsePokemonSource);

  private readonly _items = signal<PokemonSummary[]>([]);
  private readonly _status = signal<FeedStatus>('loading');
  private readonly _loadingMore = signal(false);
  private readonly _loadMoreError = signal(false);
  private readonly _hasMore = signal(true);
  private inFlight = false;

  /** The summaries loaded so far, in list order. */
  readonly items = this._items.asReadonly();
  /** First-load state: skeleton grid, grid, empty, or full-view error. */
  readonly status = this._status.asReadonly();
  /** True while appending a later page, drives the bottom spinner. */
  readonly loadingMore = this._loadingMore.asReadonly();
  /** True when a later page failed, drives the inline "couldn't load more" retry. */
  readonly loadMoreError = this._loadMoreError.asReadonly();
  /** Whether more pages remain, drives whether infinite scroll stays enabled. */
  readonly hasMore = this._hasMore.asReadonly();

  /**
   * Loads the next page.
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
}
