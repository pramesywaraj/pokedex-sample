import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PokemonTypeName, pokemonTypeNames } from '../../../domain/pokemon-type-name';

/**
 * The horizontally scrolling chip row above the Browse grid. A leading neutral
 * `All` chip returns the full Dex, then one solid chip per Type. Dumb primitive,
 * the active Type comes in and taps go out as picks.
 */
@Component({
  selector: 'app-type-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './type-filter.html',
  styleUrl: './type-filter.scss',
})
export class TypeFilter {
  /** The Type currently filtering the grid, or null when All is active. */
  readonly active = input<PokemonTypeName | null>(null);
  /** Fired when a chip is tapped: a Type name to filter by, or null for All. */
  readonly pick = output<PokemonTypeName | null>();

  /** The 18 chips, in the canonical Type order. */
  protected readonly types = pokemonTypeNames;

  /** Title cases a Type slug for the chip label, so "grass" becomes "Grass". */
  protected label(name: PokemonTypeName): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  /** CSS variable name for a Type's fill hue, matched to the theme tokens. */
  protected fillVar(name: PokemonTypeName): string {
    return `var(--pkx-type-${name})`;
  }

  /** CSS variable name for a Type's contrast label colour. */
  protected onVar(name: PokemonTypeName): string {
    return `var(--pkx-type-${name}-on)`;
  }
}
