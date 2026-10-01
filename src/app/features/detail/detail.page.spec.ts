import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DetailService, DetailStatus } from '../../application/detail.service';
import { FavouritesService } from '../../application/favourites.service';
import { NetworkService } from '../../application/network.service';
import { PokemonIndexService } from '../../application/pokemon-index.service';
import { StatusBarService } from '../../application/status-bar.service';
import { Pokemon } from '../../domain/pokemon';
import { DetailPage } from './detail.page';

const gengar: Pokemon = {
  id: 94,
  speciesId: 94,
  name: 'Gengar',
  types: ['ghost', 'poison'],
  heightM: 1.5,
  weightKg: 40.5,
  stats: {
    hp: 60,
    attack: 65,
    defense: 60,
    specialAttack: 130,
    specialDefense: 75,
    speed: 110,
    total: 500,
  },
  abilities: ['Cursed Body'],
  artworkUrl: 'art/94.png',
  frontSpriteUrl: 'front/94.png',
  backSpriteUrl: 'back/94.png',
};

describe('DetailPage status bar', () => {
  const setContentColour = vi.fn();
  const resetToCanvas = vi.fn();
  let status: WritableSignal<DetailStatus>;
  let pokemon: WritableSignal<Pokemon | undefined>;

  /** A DetailService stand-in whose whole-page state the test drives. */
  function fakeDetail(): Partial<DetailService> {
    return {
      status: status.asReadonly(),
      pokemon: pokemon.asReadonly(),
      species: signal(undefined).asReadonly(),
      descriptionStatus: signal('loading' as const).asReadonly(),
      evolution: signal(undefined).asReadonly(),
      evolutionStatus: signal('idle' as const).asReadonly(),
      category: signal(undefined).asReadonly(),
      description: signal(undefined).asReadonly(),
      load: () => Promise.resolve(),
      prefetchNeighbours: () => undefined,
    };
  }

  async function render(): Promise<ComponentFixture<DetailPage>> {
    TestBed.configureTestingModule({
      providers: [
        provideIonicAngular({}),
        provideRouter([]),
        { provide: StatusBarService, useValue: { setContentColour, resetToCanvas } },
        {
          provide: FavouritesService,
          useValue: {
            ready: signal(true).asReadonly(),
            isFavourite: () => false,
            load: () => Promise.resolve(),
          },
        },
        {
          provide: PokemonIndexService,
          useValue: {
            ready: signal(false).asReadonly(),
            load: () => Promise.resolve(),
            neighbours: () => ({}),
          },
        },
        {
          provide: NetworkService,
          useValue: { online: signal(true).asReadonly(), onReconnect: () => undefined },
        },
      ],
    });
    TestBed.overrideComponent(DetailPage, {
      add: { providers: [{ provide: DetailService, useValue: fakeDetail() }] },
    });
    const fixture = TestBed.createComponent(DetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  beforeEach(() => {
    setContentColour.mockClear();
    resetToCanvas.mockClear();
    status = signal<DetailStatus>('loading');
    pokemon = signal<Pokemon | undefined>(undefined);
    TestBed.resetTestingModule();
  });

  it('asks for black icons while the skeleton is up', async () => {
    await render();
    expect(setContentColour).toHaveBeenLastCalledWith('black');
  });

  it('follows the hero Type once the Pokémon lands', async () => {
    const fixture = await render();
    pokemon.set(gengar);
    status.set('ready');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(setContentColour).toHaveBeenLastCalledWith('white');
  });

  it('goes white over the mystery panel of a not found', async () => {
    const fixture = await render();
    status.set('notFound');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(setContentColour).toHaveBeenLastCalledWith('white');
  });

  it('hands the status bar back to the white app canvas on leaving', async () => {
    const fixture = await render();
    pokemon.set(gengar);
    status.set('ready');
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.ionViewWillLeave();
    expect(resetToCanvas).toHaveBeenCalled();
  });

  it('takes the status bar back when a stacked jump returns to this screen', async () => {
    const fixture = await render();
    pokemon.set(gengar);
    status.set('ready');
    fixture.detectChanges();
    await fixture.whenStable();

    // A pushed Detail left and handed the bar back to the canvas default.
    fixture.componentInstance.ionViewWillLeave();
    fixture.componentInstance.ionViewWillEnter();

    expect(setContentColour).toHaveBeenLastCalledWith('white');
  });
});
