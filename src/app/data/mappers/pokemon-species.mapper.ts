import { Species } from '../../domain/species';
import { PokemonSpeciesDto } from '../dto/pokemon-species.dto';
import { idFromResourceUrl } from './pokemon-summary.mapper';

const ENGLISH = 'en';

/** The soft hyphen (U+00AD) PokeAPI leaves inside some words, built by code point. */
const SOFT_HYPHEN = String.fromCharCode(0x00ad);

/**
 * Strips the control characters PokeAPI leaves in flavour text form feeds,
 * newlines and soft hyphens and collapses the runs of whitespace they leave
 * behind, so the blurb reads as one clean paragraph.
 */
export function cleanFlavorText(text: string): string {
  return text.split(SOFT_HYPHEN).join('').replace(/\s+/g, ' ').trim();
}

/** Picks the first English flavour text, or an empty string when none is present. */
function englishDescription(dto: PokemonSpeciesDto): string {
  const entry = dto.flavor_text_entries.find((e) => e.language.name === ENGLISH);
  return entry ? cleanFlavorText(entry.flavor_text) : '';
}

/** Picks the English genus label, or an empty string when none is present. */
function englishCategory(dto: PokemonSpeciesDto): string {
  const entry = dto.genera.find((g) => g.language.name === ENGLISH);
  return entry ? entry.genus : '';
}

/**
 * Maps a `/pokemon-species/{id}` response to the domain `Species`: the English
 * genus and cleaned blurb, plus the evolution chain id parsed from the DTO's
 * evolution_chain.url so the Evolution tab can fetch the family.
 */
export function toSpecies(dto: PokemonSpeciesDto): Species {
  return {
    category: englishCategory(dto),
    description: englishDescription(dto),
    evolutionChainId: idFromResourceUrl(dto.evolution_chain.url),
  };
}
