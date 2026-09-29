import { Injectable } from '@angular/core';
import { PokemonSummary } from '../../domain/pokemon-summary';
import { PokemonPage, PokemonSource } from './pokemon-source';

/** How many matches a search page yields at a time. */
export const SEARCH_PAGE_SIZE = 20;

/**
 * Client-paged loader for search matches. The full match list is set once by
 * the caller (from PokemonIndexService.search), and this source reveals it a
 * page at a time so the same infinite scroll grid can host search results
 * without a rewrite.
 */
@Injectable({ providedIn: 'root' })
export class SearchPokemonSource implements PokemonSource {
  private results: PokemonSummary[] = [];
  private cursor = 0;

  /** Replaces the match list and rewinds the cursor. */
  setResults(results: PokemonSummary[]): void {
    this.results = results;
    this.cursor = 0;
  }

  loadNext(): Promise<PokemonPage> {
    const items = this.results.slice(this.cursor, this.cursor + SEARCH_PAGE_SIZE);
    this.cursor += items.length;
    return Promise.resolve({ items, hasMore: this.cursor < this.results.length });
  }

  reset(): void {
    this.cursor = 0;
  }
}
