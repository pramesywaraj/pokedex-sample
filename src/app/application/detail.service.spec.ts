import { TestBed } from '@angular/core/testing';
import { AppError } from '../domain/app-error';
import { EvolutionChain } from '../domain/evolution';
import { Pokemon } from '../domain/pokemon';
import { Species } from '../domain/species';
import { PokemonRepository } from '../data/repository/pokemon.repository';
import { DetailService } from './detail.service';

function pokemon(id: number, speciesId = id): Pokemon {
  return {
    id,
    speciesId,
    name: `P${id}`,
    types: ['grass'],
    heightM: 0.7,
    weightKg: 6.9,
    stats: {
      hp: 45,
      attack: 49,
      defense: 49,
      specialAttack: 65,
      specialDefense: 65,
      speed: 45,
      total: 318,
    },
    abilities: ['Overgrow'],
    artworkUrl: `art/${id}.png`,
    frontSpriteUrl: `front/${id}.png`,
    backSpriteUrl: `back/${id}.png`,
  };
}

const species: Species = { category: 'Seed', description: 'A seed sleeps.', evolutionChainId: 1 };

const evolution: EvolutionChain = { chainId: 1, steps: [] };

class FakeRepository {
  pokemonOutcome: Pokemon | Error = pokemon(1);
  speciesOutcome: Species | Error = species;
  evolutionOutcome: EvolutionChain | Error = evolution;
  pokemonCalls = 0;
  speciesCalls = 0;
  evolutionCalls = 0;
  pokemonIds: number[] = [];
  speciesIds: number[] = [];
  readonly pokemonById = new Map<number, Pokemon | Error>();
  private readonly held = new Set<number>();
  private readonly pending: {
    id: number;
    resolve: (p: Pokemon) => void;
    reject: (e: Error) => void;
  }[] = [];

  getPokemon(id: number): Promise<Pokemon> {
    this.pokemonCalls++;
    this.pokemonIds.push(id);
    if (this.held.has(id)) {
      return new Promise<Pokemon>((resolve, reject) => {
        this.pending.push({ id, resolve, reject });
      });
    }
    const outcome = this.pokemonById.get(id) ?? this.pokemonOutcome;
    return outcome instanceof Error ? Promise.reject(outcome) : Promise.resolve(outcome);
  }

  getSpecies(speciesId: number): Promise<Species> {
    this.speciesCalls++;
    this.speciesIds.push(speciesId);
    return this.speciesOutcome instanceof Error
      ? Promise.reject(this.speciesOutcome)
      : Promise.resolve(this.speciesOutcome);
  }

  getEvolution(): Promise<EvolutionChain> {
    this.evolutionCalls++;
    return this.evolutionOutcome instanceof Error
      ? Promise.reject(this.evolutionOutcome)
      : Promise.resolve(this.evolutionOutcome);
  }

  holdPokemon(id: number): void {
    this.held.add(id);
  }

  resolvePokemon(id: number, value: Pokemon): void {
    const i = this.pending.findIndex((p) => p.id === id);
    if (i >= 0) {
      const [p] = this.pending.splice(i, 1);
      this.held.delete(id);
      p.resolve(value);
    }
  }
}

describe('DetailService', () => {
  let repo: FakeRepository;
  let detail: DetailService;

  beforeEach(() => {
    repo = new FakeRepository();
    TestBed.configureTestingModule({
      providers: [DetailService, { provide: PokemonRepository, useValue: repo }],
    });
    detail = TestBed.inject(DetailService);
  });

  it('stitches the pokemon and its species into a ready detail', async () => {
    repo.pokemonOutcome = pokemon(1);
    await detail.load(1);
    expect(detail.status()).toBe('ready');
    expect(detail.pokemon()?.id).toBe(1);
    expect(detail.category()).toBe('Seed');
    expect(detail.description()).toBe('A seed sleeps.');
    expect(detail.descriptionStatus()).toBe('ready');
  });

  it('reads the species by its species id, not the entry id', async () => {
    repo.pokemonOutcome = pokemon(10034, 6);
    const spy = vi.spyOn(repo, 'getSpecies');
    await detail.load(10034);
    expect(spy).toHaveBeenCalledWith(6);
  });

  it('shows the not-found state when the core pokemon 404s', async () => {
    repo.pokemonOutcome = new AppError('notFound');
    await detail.load(99999);
    expect(detail.status()).toBe('notFound');
    expect(repo.speciesCalls).toBe(0);
  });

  it('shows the whole-page error state on a transient core failure', async () => {
    repo.pokemonOutcome = new AppError('transient');
    await detail.load(1);
    expect(detail.status()).toBe('error');
  });

  it('recovers when the whole-page Retry succeeds', async () => {
    repo.pokemonOutcome = new AppError('transient');
    await detail.load(1);
    repo.pokemonOutcome = pokemon(1);
    await detail.retry();
    expect(detail.status()).toBe('ready');
    expect(detail.pokemon()?.id).toBe(1);
  });

  it('keeps the page usable and flags a per-tab error when only the species fails', async () => {
    repo.pokemonOutcome = pokemon(1);
    repo.speciesOutcome = new AppError('transient');
    await detail.load(1);
    expect(detail.status()).toBe('ready');
    expect(detail.descriptionStatus()).toBe('error');
    expect(detail.description()).toBeUndefined();
  });

  it('recovers the description when its Retry succeeds', async () => {
    repo.pokemonOutcome = pokemon(1);
    repo.speciesOutcome = new AppError('transient');
    await detail.load(1);
    repo.speciesOutcome = species;
    await detail.retryDescription();
    expect(detail.descriptionStatus()).toBe('ready');
    expect(detail.description()).toBe('A seed sleeps.');
  });

  it('leaves evolution idle until the tab asks for it', async () => {
    await detail.load(1);
    expect(detail.evolutionStatus()).toBe('idle');
    expect(repo.evolutionCalls).toBe(0);
  });

  it('lazily loads the evolution line by its chain id, once', async () => {
    await detail.load(1);
    await detail.loadEvolution();
    await detail.loadEvolution();
    expect(detail.evolutionStatus()).toBe('ready');
    expect(detail.evolution()?.chainId).toBe(1);
    expect(repo.evolutionCalls).toBe(1);
  });

  it('flags a per-tab error when evolution fails, and recovers on retry', async () => {
    await detail.load(1);
    repo.evolutionOutcome = new AppError('transient');
    await detail.loadEvolution();
    expect(detail.evolutionStatus()).toBe('error');
    repo.evolutionOutcome = evolution;
    await detail.retryEvolution();
    expect(detail.evolutionStatus()).toBe('ready');
  });

  describe('prefetchNeighbours', () => {
    it('warms both neighbours by fetching each pokemon and species', async () => {
      await detail.load(2);
      repo.pokemonCalls = 0;
      repo.speciesCalls = 0;
      repo.pokemonIds = [];
      repo.speciesIds = [];
      repo.pokemonById.set(1, pokemon(1, 1));
      repo.pokemonById.set(3, pokemon(3, 3));
      detail.prefetchNeighbours(1, 3);
      await Promise.resolve();
      await Promise.resolve();
      expect(repo.pokemonIds).toEqual([1, 3]);
      expect(repo.speciesIds).toEqual([1, 3]);
    });

    it('warms only the side that exists at the ends of the list', async () => {
      await detail.load(1);
      repo.pokemonCalls = 0;
      repo.pokemonIds = [];
      repo.pokemonById.set(2, pokemon(2, 2));
      detail.prefetchNeighbours(undefined, 2);
      await Promise.resolve();
      expect(repo.pokemonIds).toEqual([2]);
    });

    it('does nothing when both neighbours are undefined', async () => {
      await detail.load(1);
      repo.pokemonCalls = 0;
      detail.prefetchNeighbours(undefined, undefined);
      await Promise.resolve();
      expect(repo.pokemonCalls).toBe(0);
    });

    it('skips the species step for a prefetch the next load has already superseded', async () => {
      await detail.load(2);
      repo.holdPokemon(3);
      detail.prefetchNeighbours(undefined, 3);
      await detail.load(5);
      repo.speciesIds = [];
      repo.resolvePokemon(3, pokemon(3, 3));
      await Promise.resolve();
      await Promise.resolve();
      expect(repo.speciesIds).not.toContain(3);
    });

    it('swallows a prefetch failure so it never surfaces as an error', async () => {
      await detail.load(1);
      repo.pokemonById.set(2, new AppError('transient'));
      expect(() => detail.prefetchNeighbours(undefined, 2)).not.toThrow();
      await Promise.resolve();
      await Promise.resolve();
      expect(detail.status()).toBe('ready');
    });
  });
});
