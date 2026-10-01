import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { PokemonTypeName } from '../../domain/pokemon-type-name';
import { PokeApiClient } from '../api/poke-api.client';
import { CACHE } from '../cache/cache';
import { InMemoryCache } from '../cache/in-memory.cache';
import { EvolutionChainDto } from '../dto/evolution-chain.dto';
import { PokemonListDto } from '../dto/pokemon-list.dto';
import { PokemonDto } from '../dto/pokemon.dto';
import { PokemonSpeciesDto } from '../dto/pokemon-species.dto';
import { TypeDetailDto } from '../dto/type-detail.dto';
import {
  INDEX_KEY,
  PokemonRepository,
  evolutionKey,
  pokemonKey,
  speciesKey,
  typeKey,
} from './pokemon.repository';

function pokemonDto(id: number, speciesId: number): PokemonDto {
  return {
    id,
    name: 'charizard',
    height: 17,
    weight: 905,
    types: [{ slot: 1, type: { name: 'fire', url: '' } }],
    stats: [{ base_stat: 78, stat: { name: 'hp', url: '' } }],
    abilities: [{ ability: { name: 'blaze', url: '' }, is_hidden: false }],
    sprites: { front_default: 'front.png', back_default: 'back.png' },
    species: { name: 'charizard', url: `https://pokeapi.co/api/v2/pokemon-species/${speciesId}/` },
  };
}

function speciesDto(id: number): PokemonSpeciesDto {
  return {
    id,
    name: 'charizard',
    genera: [{ genus: 'Flame Pokémon', language: { name: 'en', url: '' } }],
    flavor_text_entries: [{ flavor_text: 'Spits fire.', language: { name: 'en', url: '' } }],
    evolution_chain: { url: 'https://pokeapi.co/api/v2/evolution-chain/2/' },
  };
}

function evolutionDto(id: number): EvolutionChainDto {
  return {
    id,
    chain: {
      species: { name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon-species/4/' },
      evolution_details: [],
      evolves_to: [
        {
          species: { name: 'charmeleon', url: 'https://pokeapi.co/api/v2/pokemon-species/5/' },
          evolution_details: [{ min_level: 16, item: null, trigger: null, min_happiness: null }],
          evolves_to: [],
        },
      ],
    },
  };
}

class FakeClient {
  pokemonCalls = 0;
  speciesCalls = 0;
  evolutionCalls = 0;
  probeCalls = 0;
  indexCalls = 0;
  typeCalls: string[] = [];
  typeSets = new Map<PokemonTypeName, TypeDetailDto>();
  failingTypes = new Set<PokemonTypeName>();

  getPokemon(id: number): Observable<PokemonDto> {
    this.pokemonCalls++;
    return of(pokemonDto(id, id));
  }

  getSpecies(speciesId: number): Observable<PokemonSpeciesDto> {
    this.speciesCalls++;
    return of(speciesDto(speciesId));
  }

  getEvolution(chainId: number): Observable<EvolutionChainDto> {
    this.evolutionCalls++;
    return of(evolutionDto(chainId));
  }

  getPage(): Observable<PokemonListDto> {
    this.probeCalls++;
    return of({ count: 3, next: null, previous: null, results: [] });
  }

  getIndex(limit: number): Observable<PokemonListDto> {
    this.indexCalls++;
    const results = Array.from({ length: limit }, (_, i) => ({
      name: `p-${i + 1}`,
      url: `https://pokeapi.co/api/v2/pokemon/${i + 1}/`,
    }));
    return of({ count: limit, next: null, previous: null, results });
  }

  getType(name: PokemonTypeName): Observable<TypeDetailDto> {
    this.typeCalls.push(name);
    if (this.failingTypes.has(name)) {
      return throwError(() => new Error(`type ${name} failed`));
    }
    return of(this.typeSets.get(name) ?? { pokemon: [] });
  }
}

function typeDto(entries: [id: number, slot: number][]): TypeDetailDto {
  return {
    pokemon: entries.map(([id, slot]) => ({
      slot,
      pokemon: { name: `p-${id}`, url: `https://pokeapi.co/api/v2/pokemon/${id}/` },
    })),
  };
}

describe('PokemonRepository', () => {
  let client: FakeClient;
  let cache: InMemoryCache;
  let repo: PokemonRepository;

  beforeEach(() => {
    client = new FakeClient();
    cache = new InMemoryCache();
    TestBed.configureTestingModule({
      providers: [
        PokemonRepository,
        { provide: PokeApiClient, useValue: client },
        { provide: CACHE, useValue: cache },
      ],
    });
    repo = TestBed.inject(PokemonRepository);
  });

  it('fetches, maps and stores a Pokémon on a cache miss', async () => {
    const pokemon = await repo.getPokemon(6);
    expect(pokemon.name).toBe('Charizard');
    expect(client.pokemonCalls).toBe(1);
    expect(await cache.get(pokemonKey(6))).toEqual(pokemon);
  });

  it('reuses the cached record on a second read, without a second fetch', async () => {
    await repo.getPokemon(6);
    const again = await repo.getPokemon(6);
    expect(again.name).toBe('Charizard');
    expect(client.pokemonCalls).toBe(1);
  });

  it('keys species by species id and maps it', async () => {
    const species = await repo.getSpecies(6);
    expect(species.category).toBe('Flame Pokémon');
    expect(species.evolutionChainId).toBe(2);
    expect(await cache.get(speciesKey(6))).toEqual(species);
  });

  it('keys the evolution chain by chain id and flattens it', async () => {
    const chain = await repo.getEvolution(2);
    expect(chain.chainId).toBe(2);
    expect(chain.steps.map((s) => s.to.name)).toEqual(['Charmeleon']);
    expect(client.evolutionCalls).toBe(1);
    expect(await cache.get(evolutionKey(2))).toEqual(chain);
  });

  it('coalesces concurrent misses for the same key into one request', async () => {
    const [a, b] = await Promise.all([repo.getPokemon(6), repo.getPokemon(6)]);
    expect(a).toEqual(b);
    expect(client.pokemonCalls).toBe(1);
  });

  it('does not coalesce different keys', async () => {
    await Promise.all([repo.getPokemon(6), repo.getPokemon(1)]);
    expect(client.pokemonCalls).toBe(2);
  });

  it('still returns the value when a cache write fails', async () => {
    vi.spyOn(cache, 'set').mockRejectedValue(new Error('quota'));
    const pokemon = await repo.getPokemon(6);
    expect(pokemon.name).toBe('Charizard');
  });

  describe('getTypeIndex', () => {
    it('folds every Type set into an id to Types map, primary Type first by slot', async () => {
      client.typeSets.set('fire', typeDto([[6, 1]]));
      client.typeSets.set('flying', typeDto([[6, 2]]));
      client.typeSets.set('water', typeDto([[7, 1]]));

      const index = await repo.getTypeIndex();

      expect(index.get(6)).toEqual(['fire', 'flying']);
      expect(index.get(7)).toEqual(['water']);
    });

    it('orders Types by slot even when the sets are visited in reverse', async () => {
      client.typeSets.set('flying', typeDto([[6, 2]]));
      client.typeSets.set('fire', typeDto([[6, 1]]));

      const index = await repo.getTypeIndex();

      expect(index.get(6)).toEqual(['fire', 'flying']);
    });

    it('skips a failed Type set so a single request failure does not lose the others', async () => {
      client.typeSets.set('fire', typeDto([[6, 1]]));
      client.typeSets.set('water', typeDto([[7, 1]]));
      client.failingTypes.add('fire');

      const index = await repo.getTypeIndex();

      expect(index.get(6)).toBeUndefined();
      expect(index.get(7)).toEqual(['water']);
    });

    it('caches each Type set at type:{name} for reuse by the Type filter', async () => {
      client.typeSets.set('fire', typeDto([[6, 1]]));
      await repo.getTypeIndex();
      expect(await cache.get(typeKey('fire'))).toEqual([{ id: 6, slot: 1, name: 'p-6' }]);
    });

    it('reads cached Type sets straight through on a second fold', async () => {
      client.typeSets.set('fire', typeDto([[6, 1]]));
      await repo.getTypeIndex();
      const firstRound = [...client.typeCalls];
      await repo.getTypeIndex();
      expect(client.typeCalls).toEqual(firstRound);
    });
  });

  describe('getByType', () => {
    it('builds Dex ordered summaries from the cached Type set', async () => {
      client.typeSets.set(
        'fire',
        typeDto([
          [4, 1],
          [6, 1],
          [5, 1],
        ]),
      );
      const summaries = await repo.getByType('fire');
      expect(summaries.map((s) => s.id)).toEqual([4, 5, 6]);
      expect(summaries[0].name).toBe('P 4');
      expect(summaries[0].artworkUrl).toContain('/4.png');
    });

    it('reuses a warmed Type set without a second fetch', async () => {
      client.typeSets.set('fire', typeDto([[6, 1]]));
      await repo.getTypeIndex();
      const callsAfterWarmUp = [...client.typeCalls];
      await repo.getByType('fire');
      expect(client.typeCalls).toEqual(callsAfterWarmUp);
    });

    it('fetches on a cold filter when the Type has not been warmed', async () => {
      client.typeSets.set('water', typeDto([[7, 1]]));
      const summaries = await repo.getByType('water');
      expect(client.typeCalls).toEqual(['water']);
      expect(summaries.map((s) => s.id)).toEqual([7]);
    });
  });

  describe('getIndex', () => {
    it('probes for the count, fetches the full list, maps and caches it', async () => {
      const index = await repo.getIndex();
      expect(client.probeCalls).toBe(1);
      expect(client.indexCalls).toBe(1);
      expect(index.map((i) => i.id)).toEqual([1, 2, 3]);
      expect(index[0].name).toBe('P 1');
      expect(await cache.get(INDEX_KEY)).toEqual(index);
    });

    it('serves the second read from the cache with no extra fetch', async () => {
      await repo.getIndex();
      await repo.getIndex();
      expect(client.probeCalls).toBe(1);
      expect(client.indexCalls).toBe(1);
    });
  });
});
