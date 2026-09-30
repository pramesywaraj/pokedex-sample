import { NamedApiResource } from './pokemon-list.dto';

/** One `pokemon` entry on a `/type/{name}` response, keyed by slot. */
export interface TypePokemonSlotDto {
  slot: number;
  pokemon: NamedApiResource;
}

/** The `GET /type/{name}` response shape, trimmed to the fields we map. */
export interface TypeDetailDto {
  pokemon: TypePokemonSlotDto[];
}
