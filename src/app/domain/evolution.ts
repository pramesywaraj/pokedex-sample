/**
 * One Pokémon in an evolution line. Keyed by species id, which for these base
 * stages is also the entry id, so it drives the artwork, the current-stage
 * highlight, and navigation to that stage's detail.
 */
export interface EvolutionStage {
  speciesId: number;
  name: string;
  artworkUrl: string;
}

/**
 * One evolution step, laid out as a row: `from` evolves into `to` by `method`
 * (e.g. "Lv. 16", "Use Water Stone", "Trade"; empty when PokeAPI gives no detail).
 */
export interface EvolutionStep {
  from: EvolutionStage;
  to: EvolutionStage;
  method: string;
}

/**
 * A whole evolution line, flattened to one step per edge so the tab can render
 * a row per step and let branches wrap. `steps` is empty for a Pokémon that does
 * not evolve.
 */
export interface EvolutionChain {
  chainId: number;
  steps: EvolutionStep[];
}
