import { PokemonSummary } from '../../domain/pokemon-summary';

/** One page of summaries, plus whether the source can still yield more. */
export interface PokemonPage {
  items: PokemonSummary[];
  hasMore: boolean;
}

/**
 * One infinite-scroll grid can be fed by several loaders. Browse pages over the
 * network by following `next`, a Type filter or search reveals a pre-fetched set
 * a page at a time. The grid does not know which loader is active.
 */
export interface PokemonSource {
  /** Loads the next page and advances the source's cursor. */
  loadNext(): Promise<PokemonPage>;
  /** Rewinds the source to its first page. */
  reset(): void;
}
