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

/** A scripted repository: hands back or rejects the pokemon/species/evolution reads on cue. */
class FakeRepository {
  pokemonOutcome: Pokemon | Error = pokemon(1);
  speciesOutcome: Species | Error = species;
  evolutionOutcome: EvolutionChain | Error = evolution;
  pokemonCalls = 0;
  speciesCalls = 0;
  evolutionCalls = 0;

  getPokemon(): Promise<Pokemon> {
    this.pokemonCalls++;
    return this.pokemonOutcome instanceof Error
      ? Promise.reject(this.pokemonOutcome)
      : Promise.resolve(this.pokemonOutcome);
  }

  getSpecies(): Promise<Species> {
    this.speciesCalls++;
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
});
