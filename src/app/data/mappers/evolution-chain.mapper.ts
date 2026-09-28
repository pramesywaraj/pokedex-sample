import { EvolutionChain, EvolutionStage, EvolutionStep } from '../../domain/evolution';
import { ChainLinkDto, EvolutionChainDto, EvolutionDetailDto } from '../dto/evolution-chain.dto';
import { idFromResourceUrl, titleCaseName } from './pokemon-summary.mapper';
import { artworkUrlFor } from './sprite-urls';

/** Maps one chain node to a display stage (species id, name, derived artwork). */
function toStage(link: ChainLinkDto): EvolutionStage {
  const speciesId = idFromResourceUrl(link.species.url);
  return {
    speciesId,
    name: titleCaseName(link.species.name),
    artworkUrl: artworkUrlFor(speciesId),
  };
}

/**
 * Turns a step's trigger details into a short label. Picks the most telling one
 * PokeAPI offers, level, then item, friendship, or trade, and falls back to the
 * trigger name so a step is never unlabelled unless PokeAPI gives nothing.
 */
function methodLabel(details: EvolutionDetailDto[]): string {
  const detail = details[0];
  if (!detail) {
    return '';
  }
  if (detail.min_level != null) {
    return `Lv. ${detail.min_level}`;
  }
  if (detail.item) {
    return `Use ${titleCaseName(detail.item.name)}`;
  }
  if (detail.min_happiness != null) {
    return 'Friendship';
  }
  if (detail.trigger?.name === 'trade') {
    return 'Trade';
  }
  return detail.trigger ? titleCaseName(detail.trigger.name) : '';
}

/** Walks the tree, emitting one step per edge so branches become sibling rows. */
function flatten(link: ChainLinkDto): EvolutionStep[] {
  const from = toStage(link);
  return link.evolves_to.flatMap((child) => [
    { from, to: toStage(child), method: methodLabel(child.evolution_details) },
    ...flatten(child),
  ]);
}

/**
 * Maps a `/evolution-chain/{id}` response to the domain `EvolutionChain`,
 * flattened to one step per edge. A Pokémon that does not evolve yields no steps.
 */
export function toEvolutionChain(dto: EvolutionChainDto): EvolutionChain {
  return { chainId: dto.id, steps: flatten(dto.chain) };
}
