import { TestBed } from '@angular/core/testing';
import { PokemonSummary } from '../domain/pokemon-summary';
import { PokemonTypeName } from '../domain/pokemon-type-name';
import { FeedService } from './feed.service';
import { PokemonIndexService } from './pokemon-index.service';
import { BrowsePokemonSource } from './sources/browse.source';
import { PokemonPage } from './sources/pokemon-source';
import { SearchPokemonSource } from './sources/search.source';
import { TypePokemonSource } from './sources/type.source';

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

class FakeTypeSource extends FakeSource {
  typeSetTo: PokemonTypeName | null = null;
  setType(name: PokemonTypeName): void {
    this.typeSetTo = name;
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
  let type: FakeTypeSource;
  let index: FakeIndex;
  let feed: FeedService;

  beforeEach(() => {
    browse = new FakeSource();
    search = new SearchPokemonSource();
    type = new FakeTypeSource();
    index = new FakeIndex();
    TestBed.configureTestingModule({
      providers: [
        FeedService,
        { provide: BrowsePokemonSource, useValue: browse },
        { provide: SearchPokemonSource, useValue: search },
        { provide: TypePokemonSource, useValue: type },
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

  describe('type mode', () => {
    it('switches the grid onto the picked Type', async () => {
      type.pages = [{ items: [summary(4), summary(5)], hasMore: false }];
      await feed.showByType('fire');
      expect(feed.mode()).toBe('type');
      expect(feed.activeType()).toBe('fire');
      expect(type.typeSetTo).toBe('fire');
      expect(feed.items().map((p) => p.id)).toEqual([4, 5]);
      expect(feed.status()).toBe('ready');
    });

    it('shows the loading skeleton while the first page is in flight', async () => {
      let resolvePage!: (value: PokemonPage) => void;
      type.loadNext = () =>
        new Promise<PokemonPage>((resolve) => {
          resolvePage = resolve;
        });
      const pending = feed.showByType('water');
      expect(feed.status()).toBe('loading');
      resolvePage({ items: [summary(7)], hasMore: false });
      await pending;
      expect(feed.status()).toBe('ready');
    });

    it('clears any active search when a Type is picked', async () => {
      index.results = [summary(4)];
      await feed.showSearch('char');
      type.pages = [{ items: [summary(4)], hasMore: false }];
      await feed.showByType('fire');
      expect(feed.query()).toBe('');
      expect(feed.mode()).toBe('type');
    });

    it('clears the active Type when a search is typed', async () => {
      type.pages = [{ items: [summary(4)], hasMore: false }];
      await feed.showByType('fire');
      index.results = [summary(6)];
      await feed.showSearch('char');
      expect(feed.activeType()).toBeNull();
      expect(feed.mode()).toBe('search');
    });

    it('flags an error when the cold Type fetch fails', async () => {
      type.pages = [new Error('type fetch failed')];
      await feed.showByType('grass');
      expect(feed.status()).toBe('error');
      expect(feed.items()).toEqual([]);
    });

    it('replaces the active Type with the newly picked one', async () => {
      type.pages = [
        { items: [summary(4)], hasMore: false },
        { items: [summary(7)], hasMore: false },
      ];
      await feed.showByType('fire');
      await feed.showByType('water');
      expect(feed.activeType()).toBe('water');
      expect(type.typeSetTo).toBe('water');
      expect(feed.items().map((p) => p.id)).toEqual([7]);
    });

    it('returns to browse and clears the Type when the filter is dropped', async () => {
      type.pages = [{ items: [summary(4)], hasMore: false }];
      await feed.showByType('fire');
      browse.pages = [{ items: [summary(1)], hasMore: false }];
      await feed.showBrowse();
      expect(feed.mode()).toBe('browse');
      expect(feed.activeType()).toBeNull();
      expect(feed.items().map((p) => p.id)).toEqual([1]);
    });
  });
});
