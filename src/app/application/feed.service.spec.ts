import { TestBed } from '@angular/core/testing';
import { PokemonSummary } from '../domain/pokemon-summary';
import { FeedService } from './feed.service';
import { PokemonIndexService } from './pokemon-index.service';
import { BrowsePokemonSource } from './sources/browse.source';
import { PokemonPage } from './sources/pokemon-source';
import { SearchPokemonSource } from './sources/search.source';

/** A scripted source: each entry is the next page to yield, or an error to throw. */
class FakeSource {
  pages: (PokemonPage | Error)[] = [];
  calls = 0;

  loadNext(): Promise<PokemonPage> {
    const outcome = this.pages[this.calls++];
    return outcome instanceof Error ? Promise.reject(outcome) : Promise.resolve(outcome);
  }

  reset(): void {
    this.calls = 0;
  }
}

class FakeIndex {
  results: PokemonSummary[] = [];
  search(): PokemonSummary[] {
    return this.results;
  }
}

function summary(id: number): PokemonSummary {
  return { id, name: `P${id}`, artworkUrl: `art/${id}.png` };
}

describe('FeedService', () => {
  let browse: FakeSource;
  let search: SearchPokemonSource;
  let index: FakeIndex;
  let feed: FeedService;

  beforeEach(() => {
    browse = new FakeSource();
    search = new SearchPokemonSource();
    index = new FakeIndex();
    TestBed.configureTestingModule({
      providers: [
        FeedService,
        { provide: BrowsePokemonSource, useValue: browse },
        { provide: SearchPokemonSource, useValue: search },
        { provide: PokemonIndexService, useValue: index },
      ],
    });
    feed = TestBed.inject(FeedService);
  });

  describe('browse mode', () => {
    it('loads the first page into a ready grid', async () => {
      browse.pages = [{ items: [summary(1), summary(2)], hasMore: true }];
      await feed.loadNext();
      expect(feed.status()).toBe('ready');
      expect(feed.items().map((p) => p.id)).toEqual([1, 2]);
      expect(feed.hasMore()).toBe(true);
    });

    it('shows a full-view error when the first page fails', async () => {
      browse.pages = [new Error('boom')];
      await feed.loadNext();
      expect(feed.status()).toBe('error');
      expect(feed.items()).toEqual([]);
    });

    it('recovers when the first-load Retry succeeds', async () => {
      browse.pages = [new Error('boom'), { items: [summary(1)], hasMore: false }];
      await feed.loadNext();
      await feed.loadNext();
      expect(feed.status()).toBe('ready');
      expect(feed.items().map((p) => p.id)).toEqual([1]);
      expect(feed.hasMore()).toBe(false);
    });

    it('appends the next page and clears loadingMore', async () => {
      browse.pages = [
        { items: [summary(1)], hasMore: true },
        { items: [summary(2)], hasMore: false },
      ];
      await feed.loadNext();
      await feed.loadNext();
      expect(feed.items().map((p) => p.id)).toEqual([1, 2]);
      expect(feed.hasMore()).toBe(false);
      expect(feed.loadingMore()).toBe(false);
    });

    it('keeps loaded cards and flags an inline error when a later page fails', async () => {
      browse.pages = [{ items: [summary(1)], hasMore: true }, new Error('boom')];
      await feed.loadNext();
      await feed.loadNext();
      expect(feed.items().map((p) => p.id)).toEqual([1]);
      expect(feed.status()).toBe('ready');
      expect(feed.loadMoreError()).toBe(true);
    });

    it('does not page past the end', async () => {
      browse.pages = [{ items: [summary(1)], hasMore: false }];
      await feed.loadNext();
      await feed.loadNext();
      expect(browse.calls).toBe(1);
    });
  });

  describe('search mode', () => {
    it('narrows the grid to the index match results and reports the query', async () => {
      index.results = [summary(4), summary(6)];
      await feed.showSearch('char');
      expect(feed.mode()).toBe('search');
      expect(feed.query()).toBe('char');
      expect(feed.items().map((p) => p.id)).toEqual([4, 6]);
      expect(feed.status()).toBe('ready');
    });

    it('settles on an empty status when the query has no matches', async () => {
      index.results = [];
      await feed.showSearch('nope');
      expect(feed.status()).toBe('empty');
      expect(feed.items()).toEqual([]);
    });

    it('returns to browse mode when the query is cleared', async () => {
      index.results = [summary(4)];
      await feed.showSearch('char');
      browse.pages = [{ items: [summary(1)], hasMore: false }];
      await feed.showSearch('');
      expect(feed.mode()).toBe('browse');
      expect(feed.query()).toBe('');
      expect(feed.items().map((p) => p.id)).toEqual([1]);
    });
  });
});
