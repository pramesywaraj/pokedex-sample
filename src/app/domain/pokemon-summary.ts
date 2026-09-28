/**
 * A phone-book / card entry for a Pokémon, the minimum a Browse or Favourites
 * card needs. Type is deliberately absent: `PokemonCard` takes `types` as an
 * input and reads it live from the background Type map, so a summary never carries it.
 */
export interface PokemonSummary {
  /** PokeAPI entry id. */
  id: number;
  /** Title-cased, de-hyphenated display name. */
  name: string;
  /** Official artwork URL, derived from the id. */
  artworkUrl: string;
}
