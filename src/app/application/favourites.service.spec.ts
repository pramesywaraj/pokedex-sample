import { TestBed } from '@angular/core/testing';
import { FavouriteEntry } from '../domain/favourite-entry';
import { FavouritesStore, FAVOURITES_STORE } from '../data/favourites/favourites-store';
import { InMemoryFavouritesStore } from '../data/favourites/in-memory-favourites.store';
import { FavouritesService } from './favourites.service';

function entry(id: number): FavouriteEntry {
  return { id, name: `P${id}`, artworkUrl: `art/${id}.png`, types: ['grass'] };
}

/** A store that lets the test control the outcome of its next write. */
class ScriptedStore implements FavouritesStore {
  saved: FavouriteEntry[] = [];
  nextWriteFails = false;
  nextReadFails = false;

  async readAll(): Promise<FavouriteEntry[]> {
    if (this.nextReadFails) {
      this.nextReadFails = false;
      throw new Error('read boom');
    }
    return [...this.saved];
  }

  async writeAll(entries: FavouriteEntry[]): Promise<void> {
    if (this.nextWriteFails) {
      this.nextWriteFails = false;
      throw new Error('write boom');
    }
    this.saved = [...entries];
  }
}

describe('FavouritesService', () => {
  it('reads the store on load and marks itself ready', async () => {
    const store = new InMemoryFavouritesStore();
    await store.writeAll([entry(1)]);
    TestBed.configureTestingModule({
      providers: [FavouritesService, { provide: FAVOURITES_STORE, useValue: store }],
    });
    const favourites = TestBed.inject(FavouritesService);

    await favourites.load();

    expect(favourites.status()).toBe('ready');
    expect(favourites.entries().map((e) => e.id)).toEqual([1]);
    expect(favourites.isFavourite(1)).toBe(true);
    expect(favourites.isFavourite(2)).toBe(false);
  });

  it('adds an entry on toggle when it was missing and persists it', async () => {
    const store = new InMemoryFavouritesStore();
    TestBed.configureTestingModule({
      providers: [FavouritesService, { provide: FAVOURITES_STORE, useValue: store }],
    });
    const favourites = TestBed.inject(FavouritesService);
    await favourites.load();

    const ok = await favourites.toggle(entry(6));

    expect(ok).toBe(true);
    expect(favourites.isFavourite(6)).toBe(true);
    expect((await store.readAll()).map((e) => e.id)).toEqual([6]);
  });

  it('removes an entry on toggle when it was present', async () => {
    const store = new InMemoryFavouritesStore();
    await store.writeAll([entry(6), entry(9)]);
    TestBed.configureTestingModule({
      providers: [FavouritesService, { provide: FAVOURITES_STORE, useValue: store }],
    });
    const favourites = TestBed.inject(FavouritesService);
    await favourites.load();

    const ok = await favourites.toggle(entry(6));

    expect(ok).toBe(true);
    expect(favourites.isFavourite(6)).toBe(false);
    expect((await store.readAll()).map((e) => e.id)).toEqual([9]);
  });

  it('reverts the optimistic add when the store write fails', async () => {
    const store = new ScriptedStore();
    TestBed.configureTestingModule({
      providers: [FavouritesService, { provide: FAVOURITES_STORE, useValue: store }],
    });
    const favourites = TestBed.inject(FavouritesService);
    await favourites.load();

    store.nextWriteFails = true;
    const ok = await favourites.toggle(entry(6));

    expect(ok).toBe(false);
    expect(favourites.isFavourite(6)).toBe(false);
    expect(store.saved).toEqual([]);
  });

  it('reverts the optimistic remove when the store write fails', async () => {
    const store = new ScriptedStore();
    store.saved = [entry(6)];
    TestBed.configureTestingModule({
      providers: [FavouritesService, { provide: FAVOURITES_STORE, useValue: store }],
    });
    const favourites = TestBed.inject(FavouritesService);
    await favourites.load();

    store.nextWriteFails = true;
    const ok = await favourites.toggle(entry(6));

    expect(ok).toBe(false);
    expect(favourites.isFavourite(6)).toBe(true);
    expect(store.saved.map((e) => e.id)).toEqual([6]);
  });

  it('flags a read failure so the tab can show its own error', async () => {
    const store = new ScriptedStore();
    store.nextReadFails = true;
    TestBed.configureTestingModule({
      providers: [FavouritesService, { provide: FAVOURITES_STORE, useValue: store }],
    });
    const favourites = TestBed.inject(FavouritesService);

    await favourites.load();

    expect(favourites.status()).toBe('error');
    expect(favourites.entries()).toEqual([]);
  });

  it('recovers on retry after a read failure', async () => {
    const store = new ScriptedStore();
    store.saved = [entry(1)];
    store.nextReadFails = true;
    TestBed.configureTestingModule({
      providers: [FavouritesService, { provide: FAVOURITES_STORE, useValue: store }],
    });
    const favourites = TestBed.inject(FavouritesService);

    await favourites.load();
    await favourites.retry();

    expect(favourites.status()).toBe('ready');
    expect(favourites.entries().map((e) => e.id)).toEqual([1]);
  });

  it('refuses to toggle when the read keeps failing so the stored set is never overwritten', async () => {
    const alwaysFailingRead: FavouritesStore = {
      async readAll() {
        throw new Error('read boom');
      },
      async writeAll() {
        throw new Error('should not write');
      },
    };
    TestBed.configureTestingModule({
      providers: [FavouritesService, { provide: FAVOURITES_STORE, useValue: alwaysFailingRead }],
    });
    const favourites = TestBed.inject(FavouritesService);
    await favourites.load();

    const ok = await favourites.toggle(entry(6));

    expect(ok).toBe(false);
    expect(favourites.isFavourite(6)).toBe(false);
  });

  it('recovers when the read fails once and toggle triggers a fresh, successful load', async () => {
    const store = new ScriptedStore();
    store.saved = [entry(1)];
    store.nextReadFails = true;
    TestBed.configureTestingModule({
      providers: [FavouritesService, { provide: FAVOURITES_STORE, useValue: store }],
    });
    const favourites = TestBed.inject(FavouritesService);
    await favourites.load();

    const ok = await favourites.toggle(entry(6));

    expect(ok).toBe(true);
    expect(favourites.isFavourite(1)).toBe(true);
    expect(favourites.isFavourite(6)).toBe(true);
    expect(store.saved.map((e) => e.id)).toEqual([1, 6]);
  });

  it('shares one in-flight read across concurrent load calls', async () => {
    let reads = 0;
    const store: FavouritesStore = {
      async readAll() {
        reads++;
        await Promise.resolve();
        return [];
      },
      async writeAll(): Promise<void> {
        return;
      },
    };
    TestBed.configureTestingModule({
      providers: [FavouritesService, { provide: FAVOURITES_STORE, useValue: store }],
    });
    const favourites = TestBed.inject(FavouritesService);

    await Promise.all([favourites.load(), favourites.load(), favourites.load()]);

    expect(reads).toBe(1);
  });

  describe('narrowing the saved set', () => {
    async function seeded(): Promise<FavouritesService> {
      const store = new InMemoryFavouritesStore();
      await store.writeAll([
        { id: 6, name: 'Charizard', artworkUrl: 'art/6.png', types: ['fire', 'flying'] },
        { id: 25, name: 'Pikachu', artworkUrl: 'art/25.png', types: ['electric'] },
        { id: 7, name: 'Squirtle', artworkUrl: 'art/7.png', types: ['water'] },
      ]);
      TestBed.configureTestingModule({
        providers: [FavouritesService, { provide: FAVOURITES_STORE, useValue: store }],
      });
      const favourites = TestBed.inject(FavouritesService);
      await favourites.load();
      return favourites;
    }

    it('keeps only the entries that have the Type, in either slot', async () => {
      const favourites = await seeded();

      expect(favourites.byType('fire').map((e) => e.id)).toEqual([6]);
      expect(favourites.byType('flying').map((e) => e.id)).toEqual([6]);
    });

    it('returns nothing for a Type none of the saved entries have', async () => {
      const favourites = await seeded();

      expect(favourites.byType('ghost')).toEqual([]);
    });

    it('searches the saved entries by name, ignoring case', async () => {
      const favourites = await seeded();

      expect(favourites.search('PIKA').map((e) => e.id)).toEqual([25]);
    });

    it('searches the saved entries by number', async () => {
      const favourites = await seeded();

      expect(favourites.search('25').map((e) => e.id)).toEqual([25]);
    });

    it('returns every saved entry for a blank search', async () => {
      const favourites = await seeded();

      expect(favourites.search('   ')).toHaveLength(3);
    });

    it('follows the saved set as it changes', async () => {
      const favourites = await seeded();

      await favourites.toggle({
        id: 9,
        name: 'Blastoise',
        artworkUrl: 'art/9.png',
        types: ['water'],
      });

      expect(favourites.byType('water').map((e) => e.id)).toEqual([7, 9]);
    });
  });
});
