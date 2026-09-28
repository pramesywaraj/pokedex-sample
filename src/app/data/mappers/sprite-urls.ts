import { environment } from '../../../environments/environment';

/**
 * Builds the official-artwork URL for an entry id, so a card needs no network
 * request for its image, the URL loads straight from the sprite CDN.
 */
export function artworkUrlFor(id: number): string {
  return `${environment.pokeOfficialArtworkUrl}/${id}.png`;
}
