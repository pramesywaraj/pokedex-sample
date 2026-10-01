import { Injectable, inject } from '@angular/core';
import { PokemonSummary } from '../../domain/pokemon-summary';
import { PokemonTypeName } from '../../domain/pokemon-type-name';
import { PokemonRepository } from '../../data/repository/pokemon.repository';
import { PokemonPage, PokemonSource } from './pokemon-source';

/** How many members a Type page yields at a time. */
export const TYPE_PAGE_SIZE = 20;

/**
 * Client paged loader for a Type filter. The first page fetches the whole
 * `/type/{name}` set through the repository (reusing the cached one when the
 * background warm up got there first), later pages reveal the same in memory
 * list a page at a time so the same infinite scroll grid can host filter
 * results without a rewrite.
 */
@Injectable({ providedIn: 'root' })
export class TypePokemonSource implements PokemonSource {
  private readonly repository = inject(PokemonRepository);
  private type: PokemonTypeName | null = null;
  private results: PokemonSummary[] | null = null;
  private cursor = 0;

  /** Points the source at a Type and rewinds; the set is fetched on the first loadNext. */
  setType(name: PokemonTypeName): void {
    this.type = name;
    this.results = null;
    this.cursor = 0;
  }

  async loadNext(): Promise<PokemonPage> {
    if (this.type === null) {
      return { items: [], hasMore: false };
    }
    if (this.results === null) {
      this.results = await this.repository.getByType(this.type);
    }
    const items = this.results.slice(this.cursor, this.cursor + TYPE_PAGE_SIZE);
    this.cursor += items.length;
    return { items, hasMore: this.cursor < this.results.length };
  }

  reset(): void {
    this.results = null;
    this.cursor = 0;
  }
}
