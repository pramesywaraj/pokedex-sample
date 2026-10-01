import type { DetailStatus } from '../../application/detail.service';
import type { StatusBarContentColour } from '../../application/status-bar.service';
import type { PokemonTypeName } from '../../domain/pokemon-type-name';
import { typeColour } from '../../theme/type-colours';

/**
 * Picks the colour the status bar should draw its clock and icons in while a
 * Detail screen is up, because the Type hero runs full bleed underneath it. A
 * landed Pokémon lends its primary Type label colour, the mystery panel behind
 * a not found is dark enough to want white, and the pale skeleton, error and
 * offline canvases want black.
 */
export function heroStatusBarContent(
  status: DetailStatus,
  primaryType: PokemonTypeName | undefined,
): StatusBarContentColour {
  if (status === 'notFound') {
    return 'white';
  }
  if (status === 'ready' && primaryType) {
    return typeColour(primaryType).label;
  }
  return 'black';
}
