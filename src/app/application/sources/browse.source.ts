import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PokeApiClient } from '../../data/api/poke-api.client';
import { toPokemonSummaries } from '../../data/mappers/pokemon-summary.mapper';
import { PokemonPage, PokemonSource } from './pokemon-source';

/**
 * The Browse loader, network-paged over `/pokemon`, following each response's
 * `next` link so paging steps cleanly over the id gap at 1025 to 10001 instead of
 * doing id arithmetic. It keeps only the cursor, a failed page leaves the cursor
 * put, so a retry re-fetches the same page.
 */
@Injectable({ providedIn: 'root' })
export class BrowsePokemonSource implements PokemonSource {
  private readonly client = inject(PokeApiClient);
  private next: string | null = null;

  async loadNext(): Promise<PokemonPage> {
    const dto = await firstValueFrom(this.client.getPage(this.next));
    this.next = dto.next;
    return { items: toPokemonSummaries(dto), hasMore: dto.next !== null };
  }

  reset(): void {
    this.next = null;
  }
}
