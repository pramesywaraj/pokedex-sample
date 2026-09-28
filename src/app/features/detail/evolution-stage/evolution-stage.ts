import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { EvolutionStage as Stage } from '../../../domain/evolution';
import { SpriteImage } from '../../../shared/ui/sprite-image/sprite-image';

/**
 * One tappable evolution stage, artwork in a circle over its name and number.
 * A dumb primitive: the stage comes in, a tap goes out. The current Pokémon's
 * stage is marked (an accent ring + accent name) and does not navigate to itself.
 */
@Component({
  selector: 'app-evolution-stage',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SpriteImage],
  templateUrl: './evolution-stage.html',
  styleUrl: './evolution-stage.scss',
})
export class EvolutionStage {
  readonly stage = input.required<Stage>();
  /** True when this is the Pokémon being viewed, so it gets the accent ring. */
  readonly current = input(false);
  /** Emits this stage's species id when tapped, for the page to push its detail. */
  readonly pick = output<number>();

  /** The zero-padded Dex number, e.g. "#001". */
  protected readonly numberLabel = computed(
    () => `#${String(this.stage().speciesId).padStart(3, '0')}`,
  );
}
