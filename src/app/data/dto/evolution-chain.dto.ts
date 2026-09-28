import { NamedApiResource } from './pokemon-list.dto';

/** One evolution trigger's detail, trimmed to the fields we turn into a label. */
export interface EvolutionDetailDto {
  min_level: number | null;
  item: NamedApiResource | null;
  trigger: NamedApiResource | null;
  min_happiness: number | null;
}

/** A node in the `/evolution-chain` tree: a species, how it got here, and its children. */
export interface ChainLinkDto {
  species: NamedApiResource;
  evolution_details: EvolutionDetailDto[];
  evolves_to: ChainLinkDto[];
}

/** The `GET /evolution-chain/{id}` response shape, trimmed to what we map. */
export interface EvolutionChainDto {
  id: number;
  chain: ChainLinkDto;
}
