import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PokemonTypeName } from '../../../domain/pokemon-type-name';
import { SpriteImage } from '../sprite-image/sprite-image';

@Component({
  selector: 'app-pokemon-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SpriteImage],
  templateUrl: './pokemon-card.html',
  styleUrl: './pokemon-card.scss',
})
export class PokemonCard {
  readonly id = input.required<number>();
  readonly name = input.required<string>();
  readonly artworkUrl = input.required<string>();
  readonly types = input<PokemonTypeName[] | undefined>(undefined);

  /** The primary Type, or undefined until the Type map fills. */
  protected readonly primaryType = computed(() => this.types()?.[0]);

  /** The number label, zero-padded to three (Forms keep their 5-digit id). */
  protected readonly numberLabel = computed(() => `#${String(this.id()).padStart(3, '0')}`);

  /** The card's fill colour, the primary Type's hue, or a neutral surface. */
  protected readonly fillVar = computed(() => {
    const type = this.primaryType();
    return type ? `var(--pkx-type-${type})` : 'var(--pkx-surface)';
  });

  /** The on-fill text colour, the Type's contrast label, or neutral ink. */
  protected readonly onVar = computed(() => {
    const type = this.primaryType();
    return type ? `var(--pkx-type-${type}-on)` : 'var(--pkx-ink)';
  });

  /**
   * The Type tinted shadow's rgb triple, slotted into --pkx-shadow-type from
   * the theme tokens. Neutral shadow until the Type map fills.
   */
  protected readonly shadowRgbVar = computed(() => {
    const type = this.primaryType();
    return type ? `var(--pkx-type-${type}-rgb)` : null;
  });
}
