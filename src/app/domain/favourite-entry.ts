import { PokemonTypeName } from './pokemon-type-name';

/**
 * A saved favourite, the minimum a Favourites card renders from without a fetch.
 * Types are stored so the tab can colour cards even offline; that's why favourites
 * live in a store of their own, separate from the version-cleared data cache.
 */
export interface FavouriteEntry {
  /** PokeAPI entry id, the same one Browse and Detail use. */
  id: number;
  /** Title-cased, de-hyphenated display name. */
  name: string;
  /** Official artwork URL, derived from the id. */
  artworkUrl: string;
  /** Slot-ordered Types at save time, so cards colour without touching the Type map. */
  types: PokemonTypeName[];
}
