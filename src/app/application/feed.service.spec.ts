import { TestBed } from '@angular/core/testing';
import { PokemonSummary } from '../domain/pokemon-summary';
import { FeedService } from './feed.service';
import { BrowsePokemonSource } from './sources/browse.source';
import { PokemonPage } from './sources/pokemon-source';

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

function summary(id: number): PokemonSummary {
  return { id, name: `P${id}`, artworkUrl: `art/${id}.png` };
}

describe('FeedService', () => {
  let fake: FakeSource;
  let feed: FeedService;

  beforeEach(() => {
    fake = new FakeSource();
    TestBed.configureTestingModule({
      providers: [FeedService, { provide: BrowsePokemonSource, useValue: fake }],
    });
    feed = TestBed.inject(FeedService);
  });

  it('loads the first page into a ready grid', async () => {
    fake.pages = [{ items: [summary(1), summary(2)], hasMore: true }];
    await feed.loadNext();
    expect(feed.status()).toBe('ready');
    expect(feed.items().map((p) => p.id)).toEqual([1, 2]);
    expect(feed.hasMore()).toBe(true);
  });

  it('shows a full-view error when the first page fails', async () => {
    fake.pages = [new Error('boom')];
    await feed.loadNext();
    expect(feed.status()).toBe('error');
    expect(feed.items()).toEqual([]);
  });

  it('recovers when the first-load Retry succeeds', async () => {
    fake.pages = [new Error('boom'), { items: [summary(1)], hasMore: false }];
    await feed.loadNext();
    await feed.loadNext();
    expect(feed.status()).toBe('ready');
    expect(feed.items().map((p) => p.id)).toEqual([1]);
    expect(feed.hasMore()).toBe(false);
  });

  it('appends the next page and clears loadingMore', async () => {
    fake.pages = [
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
    fake.pages = [{ items: [summary(1)], hasMore: true }, new Error('boom')];
    await feed.loadNext();
    await feed.loadNext();
    expect(feed.items().map((p) => p.id)).toEqual([1]);
    expect(feed.status()).toBe('ready');
    expect(feed.loadMoreError()).toBe(true);
  });

  it('does not page past the end', async () => {
    fake.pages = [{ items: [summary(1)], hasMore: false }];
    await feed.loadNext();
    await feed.loadNext();
    expect(fake.calls).toBe(1);
  });
});
