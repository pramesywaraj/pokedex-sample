import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PokemonTypeName, typeLabel } from '../../../domain/pokemon-type-name';

/**
 * On the coloured header the primary pill is translucent white (the header already
 * is that colour) and any extra type is a solid pill in its own colour.
 */
export type TypeBadgeVariant = 'primary' | 'solid';

/**
 * A dumb Type pill. It shows a title-cased Type name tinted from the Type-colour
 * tokens, either solid in the Type's own colour or as the translucent-white
 * primary pill used on a matching coloured header.
 */
@Component({
  selector: 'app-type-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './type-badge.html',
  styleUrl: './type-badge.scss',
})
export class TypeBadge {
  readonly type = input.required<PokemonTypeName>();
  readonly variant = input<TypeBadgeVariant>('solid');

  /** Title-cased Type name for display, e.g. "grass" becomes "Grass". */
  protected readonly label = computed(() => typeLabel(this.type()));

  /** The pill's fill, the Type's own hue for a solid pill. */
  protected readonly fillVar = computed(() => `var(--pkx-type-${this.type()})`);
  /** The pill's text colour, the Type's contrast label for a solid pill. */
  protected readonly onVar = computed(() => `var(--pkx-type-${this.type()}-on)`);
}
