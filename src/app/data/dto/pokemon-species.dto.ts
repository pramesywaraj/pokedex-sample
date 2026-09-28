import { NamedApiResource } from './pokemon-list.dto';

/** One genus label on a species response, tagged with its language. */
export interface GenusDto {
  genus: string;
  language: NamedApiResource;
}

/** One flavour-text entry on a species response, tagged with its language. */
export interface FlavorTextEntryDto {
  flavor_text: string;
  language: NamedApiResource;
}

/** The `GET /pokemon-species/{id}` response shape, trimmed to the fields we map. */
export interface PokemonSpeciesDto {
  id: number;
  name: string;
  genera: GenusDto[];
  flavor_text_entries: FlavorTextEntryDto[];
  evolution_chain: { url: string };
}
