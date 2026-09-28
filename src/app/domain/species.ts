/**
 * The `/pokemon-species/{speciesId}` record: the richer classification behind a
 * Pokémon. Keyed by species id so a Form and its base share one, it carries the
 * Pokédex blurb, the genus label, and the id of the Evolution line.
 */
export interface Species {
  /** Genus label, e.g. "Seed Pokémon". */
  category: string;
  /** Cleaned English flavour text. */
  description: string;
  /** Evolution chain id, parsed from the species DTO's evolution_chain.url. */
  evolutionChainId: number;
}
