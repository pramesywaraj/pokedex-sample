import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EvolutionChainDto } from '../dto/evolution-chain.dto';
import { PokemonListDto } from '../dto/pokemon-list.dto';
import { PokemonSpeciesDto } from '../dto/pokemon-species.dto';
import { PokemonDto } from '../dto/pokemon.dto';

export const BROWSE_PAGE_SIZE = 20;

/**
 * The single touch point for HttpClient / PokeAPI URLs.
 * Everything above the data layer goes through mappers and services, never
 * these endpoints directly.
 */
@Injectable({ providedIn: 'root' })
export class PokeApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.pokeApiBaseUrl;

  /**
   * Fetches one page of the `/pokemon` list. Pass the previous page's `next`
   * link to page forward, or `null` for the first page, so paging follows the
   * list's own links rather than id arithmetic.
   */
  getPage(next: string | null): Observable<PokemonListDto> {
    const url = next ?? `${this.baseUrl}/pokemon?offset=0&limit=${BROWSE_PAGE_SIZE}`;
    return this.http.get<PokemonListDto>(url);
  }

  /**
   * Fetches the whole `/pokemon` list in one shot for the startup index. The
   * `limit` should be the count read from a `limit=1` probe, so no hard-coded
   * number can silently truncate as the dex grows.
   */
  getIndex(limit: number): Observable<PokemonListDto> {
    return this.http.get<PokemonListDto>(`${this.baseUrl}/pokemon?offset=0&limit=${limit}`);
  }

  /** Fetches one `/pokemon/{id}` record by entry id. */
  getPokemon(id: number): Observable<PokemonDto> {
    return this.http.get<PokemonDto>(`${this.baseUrl}/pokemon/${id}`);
  }

  /** Fetches one `/pokemon-species/{speciesId}` record by species id (the Dex number). */
  getSpecies(speciesId: number): Observable<PokemonSpeciesDto> {
    return this.http.get<PokemonSpeciesDto>(`${this.baseUrl}/pokemon-species/${speciesId}`);
  }

  /** Fetches one `/evolution-chain/{chainId}` record (a whole line shares one). */
  getEvolution(chainId: number): Observable<EvolutionChainDto> {
    return this.http.get<EvolutionChainDto>(`${this.baseUrl}/evolution-chain/${chainId}`);
  }
}
