import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EvolutionChain } from '../../domain/evolution';
import { Pokemon } from '../../domain/pokemon';
import { PokemonSummary } from '../../domain/pokemon-summary';
import { PokemonTypeName, pokemonTypeNames } from '../../domain/pokemon-type-name';
import { Species } from '../../domain/species';
import { PokeApiClient } from '../api/poke-api.client';
import { CACHE } from '../cache/cache';
import { toEvolutionChain } from '../mappers/evolution-chain.mapper';
import { toPokemon } from '../mappers/pokemon.mapper';
import { toSpecies } from '../mappers/pokemon-species.mapper';
import { toPokemonSummaries } from '../mappers/pokemon-summary.mapper';
import { TypeMember, toTypeMembers } from '../mappers/type.mapper';

/** Cache key for the phone-book index (the full ordered list of every entry). */
export const INDEX_KEY = 'index';
/** Cache key for a Pokémon record, by entry id. */
export const pokemonKey = (id: number): string => `pokemon:${id}`;
/** Cache key for a species record, by species id (a Form and its base share it). */
export const speciesKey = (speciesId: number): string => `species:${speciesId}`;
/** Cache key for an evolution chain, by chain id (a whole line shares it). */
export const evolutionKey = (chainId: number): string => `evolution:${chainId}`;
/** Cache key for a Type set, by Type name. */
export const typeKey = (name: PokemonTypeName): string => `type:${name}`;

/** In-memory lookup from entry id to its Types, primary Type first for card colouring. */
export type TypeIndex = ReadonlyMap<number, PokemonTypeName[]>;

/**
 * The fetch-or-reuse boundary the detail side reads through. Every resource is
 * read from the cache first and fetched from the network at most once: on a miss
 * it fetches, maps and stores, and concurrent misses for the same key share one
 * in-flight request (single-flight coalescing). A failed cache write is swallowed
 * so the app still works from the network.
 */
@Injectable({ providedIn: 'root' })
export class PokemonRepository {
  private readonly client = inject(PokeApiClient);
  private readonly cache = inject(CACHE);
  private readonly inflight = new Map<string, Promise<unknown>>();

  /**
   * Reads the phone-book index (every entry's id and title-cased name, in list
   * order), keyed `index`. Loaded via count then fetch the data, one `limit=1` probe to
   * read the total, then one `limit={count}` call, so no hardcoded limit can
   * silently truncate as the dex grows.
   */
  getIndex(): Promise<PokemonSummary[]> {
    return this.read(INDEX_KEY, async () => {
      const probe = await firstValueFrom(this.client.getPage(null));
      const full = await firstValueFrom(this.client.getIndex(probe.count));
      return toPokemonSummaries(full);
    });
  }

  /** Reads a Pokémon by entry id, keyed `pokemon:{id}`. */
  getPokemon(id: number): Promise<Pokemon> {
    return this.read(pokemonKey(id), async () =>
      toPokemon(await firstValueFrom(this.client.getPokemon(id))),
    );
  }

  /** Reads a species by species id (the Dex number), keyed `species:{speciesId}`. */
  getSpecies(speciesId: number): Promise<Species> {
    return this.read(speciesKey(speciesId), async () =>
      toSpecies(await firstValueFrom(this.client.getSpecies(speciesId))),
    );
  }

  /** Reads an evolution chain by chain id, keyed `evolution:{chainId}`. */
  getEvolution(chainId: number): Promise<EvolutionChain> {
    return this.read(evolutionKey(chainId), async () =>
      toEvolutionChain(await firstValueFrom(this.client.getEvolution(chainId))),
    );
  }

  /**
   * Folds the 18 Type sets into a lookup from entry id to its Types, each
   * Pokémon's Types in slot order so `types[0]` is the primary. Runs off the
   * scroll path (the background warm up in the index service), so cards can
   * re colour in reactively once the map fills. A failed Type set is skipped,
   * its members just stay neutral tinted.
   */
  async getTypeIndex(): Promise<TypeIndex> {
    const sets = await Promise.all(
      pokemonTypeNames.map(async (name) => {
        try {
          return { name, members: await this.readType(name) };
        } catch {
          return { name, members: [] };
        }
      }),
    );
    const bySlot = new Map<number, { name: PokemonTypeName; slot: number }[]>();
    for (const { name, members } of sets) {
      for (const member of members) {
        const slots = bySlot.get(member.id) ?? [];
        slots.push({ name, slot: member.slot });
        bySlot.set(member.id, slots);
      }
    }
    const index = new Map<number, PokemonTypeName[]>();
    for (const [id, slots] of bySlot) {
      slots.sort((a, b) => a.slot - b.slot);
      index.set(
        id,
        slots.map((s) => s.name),
      );
    }
    return index;
  }

  /** Reads a Type set from the cache or fetches and maps it on a miss. */
  private readType(name: PokemonTypeName): Promise<TypeMember[]> {
    return this.read(typeKey(name), async () =>
      toTypeMembers(await firstValueFrom(this.client.getType(name))),
    );
  }

  /**
   * Serves a key from the cache, or coalesces onto the one in-flight fetch for it.
   * The in-flight entry is registered synchronously and spans the cache read and
   * the fetch, so concurrent callers for the same key never fire two requests.
   */
  private read<T>(key: string, fetchAndMap: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(key);
    if (existing) {
      return existing as Promise<T>;
    }
    const load = this.loadThroughCache(key, fetchAndMap);
    this.inflight.set(key, load);
    return load.finally(() => this.inflight.delete(key));
  }

  private async loadThroughCache<T>(key: string, fetchAndMap: () => Promise<T>): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }
    const value = await fetchAndMap();
    await this.trySet(key, value);
    return value;
  }

  /** Stores a value, swallowing a write failure so the app still works from the network. */
  private async trySet<T>(key: string, value: T): Promise<void> {
    try {
      await this.cache.set(key, value);
    } catch {
      // A failed cache write is non-fatal, the value was still returned from the network.
    }
  }
}
