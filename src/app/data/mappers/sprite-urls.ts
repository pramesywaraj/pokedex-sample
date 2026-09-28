import { environment } from '../../../environments/environment';

/**
 * Builds the official-artwork URL for an entry id, so a card needs no network
 * request for its image, the URL loads straight from the sprite CDN.
 */
export function artworkUrlFor(id: number): string {
  return `${environment.pokeOfficialArtworkUrl}/${id}.png`;
}

/** Builds the front pixel-sprite URL for an entry id, derived so no request is needed. */
export function frontSpriteUrlFor(id: number): string {
  return `${environment.pokeSpriteUrl}/${id}.png`;
}

/** Builds the back pixel-sprite URL for an entry id, derived so no request is needed. */
export function backSpriteUrlFor(id: number): string {
  return `${environment.pokeSpriteUrl}/back/${id}.png`;
}
