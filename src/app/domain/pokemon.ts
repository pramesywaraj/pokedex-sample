import { PokemonTypeName } from './pokemon-type-name';
import { StatSet } from './stat-set';

/**
 * The core `/pokemon/{id}` record: stats, physical attributes, images and Type.
 * Its `id` is the entry id (10001+ for Forms). `speciesId` is the Dex number and
 * is what fetches the species/evolution, so a Form reaches its base's line.
 */
export interface Pokemon {
  /** PokeAPI entry id, displayed and used for artwork/sprite URLs. */
  id: number;
  /** Dex number / species id, drives the species and evolution fetch. */
  speciesId: number;
  /** Title-cased, de-hyphenated display name. */
  name: string;
  /** Slot-ordered Types; `types[0]` is the primary Type. */
  types: PokemonTypeName[];
  heightM: number;
  weightKg: number;
  stats: StatSet;
  /** Title-cased ability names. */
  abilities: string[];
  artworkUrl: string;
  frontSpriteUrl: string;
  /** Back sprite URL, or null when this Pokémon has no back sprite. */
  backSpriteUrl: string | null;
}
