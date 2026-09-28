import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBack, swapHorizontal } from 'ionicons/icons';
import { Pokemon } from '../../../domain/pokemon';
import { SpriteImage } from '../../../shared/ui/sprite-image/sprite-image';
import { TypeBadge } from '../../../shared/ui/type-badge/type-badge';

addIcons({ arrowBack, swapHorizontal });

/**
 * The coloured detail hero, the fixed top section over the primary-Type panel,
 * back control, name, number, genus, Type pills, the official artwork, and the
 * front/back sprite flip. Dumb, the Pokémon and its genus come in, Back goes out;
 * the flip is local view state.
 */
@Component({
  selector: 'app-detail-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon, SpriteImage, TypeBadge],
  templateUrl: './detail-header.html',
  styleUrl: './detail-header.scss',
})
export class DetailHeader {
  readonly pokemon = input.required<Pokemon>();
  /** The category label ("Seed Pokémon"), absent until the species read lands. */
  readonly category = input<string | undefined>(undefined);
  readonly back = output<void>();

  /** True once the Trainer flips to the back sprite; also drives aria-pressed. */
  protected readonly flipped = signal(false);

  /** The primary Type, which colours the panel and marks the primary pill. */
  protected readonly primaryType = computed(() => this.pokemon().types[0]);
  /** The extra Types shown as solid pills beside the primary one. */
  protected readonly extraTypes = computed(() => this.pokemon().types.slice(1));

  /** The number, zero-padded to at least three digits so Forms keep their 5-digit id. */
  protected readonly numberLabel = computed(() => `#${String(this.pokemon().id).padStart(3, '0')}`);

  /** Whether a back sprite exists, so the flip control can hide without one. */
  protected readonly canFlip = computed(() => this.pokemon().backSpriteUrl !== null);

  /** The image shown, the official artwork by default, the back sprite when flipped. */
  protected readonly displaySrc = computed(() =>
    this.flipped() ? this.pokemon().backSpriteUrl! : this.pokemon().artworkUrl,
  );

  /** Alt text that names which side of the Pokémon is showing. */
  protected readonly displayAlt = computed(
    () => `${this.pokemon().name} ${this.flipped() ? 'back sprite' : 'artwork'}`,
  );

  /** Swaps between the artwork and the back sprite. */
  protected toggleFlip(): void {
    this.flipped.update((on) => !on);
  }
}
