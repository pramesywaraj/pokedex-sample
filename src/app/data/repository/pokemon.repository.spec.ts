import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { PokeApiClient } from '../api/poke-api.client';
import { CACHE } from '../cache/cache';
import { InMemoryCache } from '../cache/in-memory.cache';
import { PokemonDto } from '../dto/pokemon.dto';
import { PokemonSpeciesDto } from '../dto/pokemon-species.dto';
import { PokemonRepository, pokemonKey, speciesKey } from './pokemon.repository';

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

class FakeClient {
  pokemonCalls = 0;
  speciesCalls = 0;

  getPokemon(id: number): Observable<PokemonDto> {
    this.pokemonCalls++;
    return of(pokemonDto(id, id));
  }

  getSpecies(speciesId: number): Observable<PokemonSpeciesDto> {
    this.speciesCalls++;
    return of(speciesDto(speciesId));
  }
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
});
