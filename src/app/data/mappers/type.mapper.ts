import { TypeDetailDto } from '../dto/type-detail.dto';
import { idFromResourceUrl } from './pokemon-summary.mapper';

/**
 * One member of a Type set. Slot tells us which Type is primary on a dual
 * Type Pokémon. Name is the raw PokeAPI slug so the Type filter can title case it into a
 * summary without a second fetch.
 */
export interface TypeMember {
  id: number;
  slot: number;
  name: string;
}

/**
 * Reads a `/type/{name}` DTO down to its members. Keeps id, slot, and the
 * raw name slug so downstream can either fold slots into the colour map or
 * build card summaries for the Type filter.
 */
export function toTypeMembers(dto: TypeDetailDto): TypeMember[] {
  return dto.pokemon.map((entry) => ({
    id: idFromResourceUrl(entry.pokemon.url),
    slot: entry.slot,
    name: entry.pokemon.name,
  }));
}
