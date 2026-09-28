import { NamedApiResource } from './pokemon-list.dto';

/** One Type slot on a `/pokemon` response (`slot` gives the primary/secondary order). */
export interface PokemonTypeSlotDto {
  slot: number;
  type: NamedApiResource;
}

/** One base-stat entry on a `/pokemon` response. */
export interface PokemonStatDto {
  base_stat: number;
  stat: NamedApiResource;
}

/** One ability entry on a `/pokemon` response. */
export interface PokemonAbilityDto {
  ability: NamedApiResource;
  is_hidden: boolean;
}

/** The sprite URLs we read: the front/back defaults tell us whether a back exists. */
export interface PokemonSpritesDto {
  front_default: string | null;
  back_default: string | null;
}

/** The `GET /pokemon/{id}` response shape, trimmed to the fields we map. */
export interface PokemonDto {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: PokemonTypeSlotDto[];
  stats: PokemonStatDto[];
  abilities: PokemonAbilityDto[];
  sprites: PokemonSpritesDto;
  species: NamedApiResource;
}
