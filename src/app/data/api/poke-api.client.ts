import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PokemonListDto } from '../dto/pokemon-list.dto';

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
}
