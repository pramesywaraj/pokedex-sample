import { TypeDetailDto } from '../dto/type-detail.dto';
import { idFromResourceUrl } from './pokemon-summary.mapper';

/** One member of a Type set: the Pokémon's entry id and its slot on that Type. */
export interface TypeMember {
  id: number;
  slot: number;
}

/**
 * Reads a `/type/{name}` DTO down to the entry ids and their slots. Slot tells
 * us which Type is primary on a dual Type Pokémon, so cards colour by the right
 * one when the map is folded.
 */
export function toTypeMembers(dto: TypeDetailDto): TypeMember[] {
  return dto.pokemon.map((entry) => ({
    id: idFromResourceUrl(entry.pokemon.url),
    slot: entry.slot,
  }));
}
