import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { WritableSignal, signal } from '@angular/core';
import { FavouritesService } from '../../application/favourites.service';
import { matchesQuery } from '../../application/matches-query';
import { FavouriteEntry } from '../../domain/favourite-entry';
import { PokemonTypeName } from '../../domain/pokemon-type-name';
import { SearchBar } from '../../shared/ui/search-bar/search-bar';
import { TypeFilter } from '../../shared/ui/type-filter/type-filter';
import { FavouritesPage } from './favourites.page';

const charizard: FavouriteEntry = {
  id: 6,
  name: 'Charizard',
  artworkUrl: 'art/6.png',
  types: ['fire', 'flying'],
};
const pikachu: FavouriteEntry = {
  id: 25,
  name: 'Pikachu',
  artworkUrl: 'art/25.png',
  types: ['electric'],
};
const squirtle: FavouriteEntry = {
  id: 7,
  name: 'Squirtle',
  artworkUrl: 'art/7.png',
  types: ['water'],
};

/** A ready FavouritesService stand-in holding the given saved set. */
function fakeFavourites(entries: WritableSignal<FavouriteEntry[]>): Partial<FavouritesService> {
  return {
    entries: entries.asReadonly(),
    status: signal('ready' as const).asReadonly(),
    load: () => Promise.resolve(),
    byType: (type) => entries().filter((entry) => entry.types.includes(type)),
    search: (text) =>
      text.trim().length === 0 ? entries() : entries().filter((entry) => matchesQuery(entry, text)),
  };
}

describe('FavouritesPage', () => {
  const saved = signal<FavouriteEntry[]>([]);

  async function render(entries: FavouriteEntry[]): Promise<ComponentFixture<FavouritesPage>> {
    saved.set(entries);
    TestBed.configureTestingModule({
      providers: [
        provideIonicAngular({}),
        provideRouter([]),
        { provide: FavouritesService, useValue: fakeFavourites(saved) },
      ],
    });
    const fixture = TestBed.createComponent(FavouritesPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function el(fixture: ComponentFixture<FavouritesPage>): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function cardNames(fixture: ComponentFixture<FavouritesPage>): string[] {
    return Array.from(el(fixture).querySelectorAll('app-pokemon-card')).map(
      (card) => card.textContent?.trim() ?? '',
    );
  }

  /** Taps a Type chip the way a Trainer would, through the filter's own output. */
  function pickType(fixture: ComponentFixture<FavouritesPage>, type: PokemonTypeName | null): void {
    const filter: TypeFilter = fixture.debugElement.query(
      By.directive(TypeFilter),
    ).componentInstance;
    filter.pick.emit(type);
    fixture.detectChanges();
  }

  /** Types into the search bar through its debounced output. */
  function search(fixture: ComponentFixture<FavouritesPage>, text: string): void {
    const bar: SearchBar = fixture.debugElement.query(By.directive(SearchBar)).componentInstance;
    bar.queryChange.emit(text);
    fixture.detectChanges();
  }

  it('leaves the search bar and the Type chips out of the empty state', async () => {
    const fixture = await render([]);

    expect(el(fixture).textContent).toContain('No favourites yet');
    expect(el(fixture).querySelector('app-search-bar')).toBeNull();
    expect(el(fixture).querySelector('app-type-filter')).toBeNull();
  });

  it('shows the search bar, the Type chips and every card once there are favourites', async () => {
    const fixture = await render([charizard, pikachu, squirtle]);

    expect(el(fixture).querySelector('app-search-bar')).not.toBeNull();
    expect(el(fixture).querySelector('app-type-filter')).not.toBeNull();
    expect(cardNames(fixture)).toHaveLength(3);
  });

  it('tells the Trainer the search only covers their favourites', async () => {
    const fixture = await render([charizard]);
    const field = el(fixture).querySelector('input');

    expect(field?.getAttribute('placeholder')).toBe('Search your favourites Pokémon Name or Dex Number');
  });

  it('narrows the grid to the picked Type', async () => {
    const fixture = await render([charizard, pikachu, squirtle]);

    pickType(fixture, 'water');

    expect(cardNames(fixture)).toHaveLength(1);
    expect(cardNames(fixture)[0]).toContain('Squirtle');
  });

  it('shows a No Type favourites message when the picked Type matches nothing', async () => {
    const fixture = await render([charizard, pikachu]);

    pickType(fixture, 'ghost');

    expect(cardNames(fixture)).toHaveLength(0);
    expect(el(fixture).textContent).toContain('No Ghost favourites');
  });

  it('brings every card back when All is picked', async () => {
    const fixture = await render([charizard, pikachu]);
    pickType(fixture, 'ghost');

    pickType(fixture, null);

    expect(cardNames(fixture)).toHaveLength(2);
  });

  it('narrows the grid to the favourites that match the search', async () => {
    const fixture = await render([charizard, pikachu, squirtle]);

    search(fixture, 'pika');

    expect(cardNames(fixture)).toHaveLength(1);
    expect(cardNames(fixture)[0]).toContain('Pikachu');
  });

  it('shows No matches when the search finds nothing in the saved set', async () => {
    const fixture = await render([charizard, pikachu]);

    search(fixture, 'zzz');

    expect(cardNames(fixture)).toHaveLength(0);
    expect(el(fixture).textContent).toContain('No matches');
  });

  it('drops the Type filter when the Trainer starts searching', async () => {
    const fixture = await render([charizard, pikachu, squirtle]);
    pickType(fixture, 'water');

    search(fixture, 'char');

    expect(fixture.debugElement.query(By.directive(TypeFilter)).componentInstance.active()).toBe(
      null,
    );
    expect(cardNames(fixture)).toHaveLength(1);
    expect(cardNames(fixture)[0]).toContain('Charizard');
  });

  it('drops the search when the Trainer picks a Type', async () => {
    const fixture = await render([charizard, pikachu, squirtle]);
    search(fixture, 'char');

    pickType(fixture, 'water');

    expect(cardNames(fixture)).toHaveLength(1);
    expect(cardNames(fixture)[0]).toContain('Squirtle');
  });

  it('shows everything again when the search is cleared', async () => {
    const fixture = await render([charizard, pikachu]);
    search(fixture, 'zzz');

    search(fixture, '');

    expect(cardNames(fixture)).toHaveLength(2);
  });

  it('starts fresh when the saved set empties out and fills up again', async () => {
    const fixture = await render([charizard, pikachu]);
    pickType(fixture, 'fire');

    saved.set([]);
    fixture.detectChanges();
    saved.set([charizard, pikachu]);
    fixture.detectChanges();

    expect(cardNames(fixture)).toHaveLength(2);
  });

  it('treats a blank search as no search', async () => {
    const fixture = await render([charizard, pikachu]);
    pickType(fixture, 'fire');

    search(fixture, '   ');

    expect(cardNames(fixture)).toHaveLength(1);
    expect(cardNames(fixture)[0]).toContain('Charizard');
  });
});
