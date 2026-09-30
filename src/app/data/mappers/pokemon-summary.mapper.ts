import { PokemonSummary } from '../../domain/pokemon-summary';
import { NamedApiResource, PokemonListDto } from '../dto/pokemon-list.dto';
import { artworkUrlFor } from './sprite-urls';

/** Extracts the trailing entry id from a PokeAPI resource url
 * For example :
 * We hit GET ".../pokemon/25/", then it transformed into 25.
 */
export function idFromResourceUrl(url: string): number {
  const match = /\/(\d+)\/?$/.exec(url);
  if (!match) {
    throw new Error(`Unrecognised PokeAPI resource url: ${url}`);
  }
  return Number(match[1]);
}

/**
 * Title-cases and de-hyphenates a PokeAPI name slug.
 * For Example :
 * "mr-mime" to "Mr Mime"
 * "charizard-mega-x" to "Charizard Mega X"
 */
export function titleCaseName(slug: string): string {
  return slug
    .split('-')
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Maps one list `{ name, url }` ref to a card-ready summary (id + name + derived artwork). */
export function toPokemonSummary(ref: NamedApiResource): PokemonSummary {
  const id = idFromResourceUrl(ref.url);
  return { id, name: titleCaseName(ref.name), artworkUrl: artworkUrlFor(id) };
}

/** Maps a `/pokemon` list page to its card summaries, preserving list order. */
export function toPokemonSummaries(dto: PokemonListDto): PokemonSummary[] {
  return dto.results.map(toPokemonSummary);
}
