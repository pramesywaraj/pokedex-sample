import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { signal } from '@angular/core';
import { NetworkService } from '../../application/network.service';
import { PokemonIndexService } from '../../application/pokemon-index.service';
import { BrowsePokemonSource } from '../../application/sources/browse.source';
import { PokemonPage } from '../../application/sources/pokemon-source';
import { TypePokemonSource } from '../../application/sources/type.source';
import { PokemonSummary } from '../../domain/pokemon-summary';
import { BrowsePage } from './browse.page';

const bulbasaur: PokemonSummary = { id: 1, name: 'Bulbasaur', artworkUrl: 'art/1.png' };
const charmander: PokemonSummary = { id: 4, name: 'Charmander', artworkUrl: 'art/4.png' };
const squirtle: PokemonSummary = { id: 7, name: 'Squirtle', artworkUrl: 'art/7.png' };

const wholeDex = [bulbasaur, charmander, squirtle];

/** A source that hands back one fixed page, standing in for a network loader. */
function fakeSource(items: PokemonSummary[]): {
  loadNext: () => Promise<PokemonPage>;
  reset: () => void;
} {
  return {
    loadNext: () => Promise.resolve({ items, hasMore: false }),
    reset: () => undefined,
  };
}

/** A loaded index, so the search bar is enabled and search has something to match. */
function fakeIndex(): Partial<PokemonIndexService> {
  return {
    disabled: signal(false).asReadonly(),
    error: signal(false).asReadonly(),
    typesOf: () => [],
    warmUpTypes: () => Promise.resolve(),
    retry: () => Promise.resolve(),
    search: (text: string) =>
      wholeDex.filter((pokemon) => pokemon.name.toLowerCase().includes(text.toLowerCase())),
  };
}

describe('BrowsePage', () => {
  async function render(): Promise<ComponentFixture<BrowsePage>> {
    TestBed.configureTestingModule({
      providers: [
        provideIonicAngular({}),
        provideRouter([]),
        { provide: BrowsePokemonSource, useValue: fakeSource(wholeDex) },
        {
          provide: TypePokemonSource,
          useValue: { ...fakeSource([squirtle]), setType: () => undefined },
        },
        { provide: PokemonIndexService, useValue: fakeIndex() },
        {
          provide: NetworkService,
          useValue: { online: signal(true).asReadonly(), onReconnect: () => undefined },
        },
      ],
    });
    const fixture = TestBed.createComponent(BrowsePage);
    fixture.detectChanges();
    await settle(fixture);
    return fixture;
  }

  /** Lets pending promises resolve and the debounce window elapse, then re-renders. */
  async function settle(fixture: ComponentFixture<BrowsePage>): Promise<void> {
    await vi.advanceTimersByTimeAsync(400);
    fixture.detectChanges();
  }

  function el(fixture: ComponentFixture<BrowsePage>): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function cardNames(fixture: ComponentFixture<BrowsePage>): string[] {
    return Array.from(el(fixture).querySelectorAll('app-pokemon-card')).map(
      (card) => card.textContent?.trim() ?? '',
    );
  }

  /** Taps a Type chip by its label, the way a Trainer would. */
  function tapChip(fixture: ComponentFixture<BrowsePage>, label: string): void {
    const chip = Array.from(
      el(fixture).querySelectorAll<HTMLButtonElement>('app-type-filter .chip'),
    ).find((button) => button.textContent?.trim() === label);
    chip?.click();
    fixture.detectChanges();
  }

  /** The label of the chip currently marked selected. */
  function selectedChip(fixture: ComponentFixture<BrowsePage>): string | undefined {
    return el(fixture)
      .querySelector('app-type-filter .chip[aria-selected="true"]')
      ?.textContent?.trim();
  }

  /** Types into the real search bar, debounce and all. */
  async function search(fixture: ComponentFixture<BrowsePage>, text: string): Promise<void> {
    const field = el(fixture).querySelector('input');
    if (field) {
      field.value = text;
      field.dispatchEvent(new Event('input'));
    }
    await settle(fixture);
  }

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('keeps the Type picked on a freshly loaded page', async () => {
    const fixture = await render();

    tapChip(fixture, 'Water');
    await settle(fixture);

    expect(selectedChip(fixture)).toBe('Water');
    expect(cardNames(fixture)).toHaveLength(1);
    expect(cardNames(fixture)[0]).toContain('Squirtle');
  });

  it('keeps the Type picked when a search was in play before the tap', async () => {
    const fixture = await render();
    await search(fixture, 'char');

    tapChip(fixture, 'Water');
    await settle(fixture);

    expect(selectedChip(fixture)).toBe('Water');
    expect(cardNames(fixture)[0]).toContain('Squirtle');
  });

  it('goes back to the whole Dex when All is picked', async () => {
    const fixture = await render();
    tapChip(fixture, 'Water');
    await settle(fixture);

    tapChip(fixture, 'All');
    await settle(fixture);

    expect(selectedChip(fixture)).toBe('All');
    expect(cardNames(fixture)).toHaveLength(3);
  });

  it('goes back to the whole Dex when the search text is deleted', async () => {
    const fixture = await render();
    await search(fixture, 'char');
    expect(cardNames(fixture)).toHaveLength(1);

    await search(fixture, '');

    expect(selectedChip(fixture)).toBe('All');
    expect(cardNames(fixture)).toHaveLength(3);
  });

  it('drops the Type filter once the Trainer starts searching', async () => {
    const fixture = await render();
    tapChip(fixture, 'Water');
    await settle(fixture);

    await search(fixture, 'char');

    expect(selectedChip(fixture)).toBe('All');
    expect(cardNames(fixture)[0]).toContain('Charmander');
  });
});
