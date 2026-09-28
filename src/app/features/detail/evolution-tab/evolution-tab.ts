import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IonButton } from '@ionic/angular';
import { EvolutionStatus } from '../../../application/detail.service';
import { EvolutionChain, EvolutionStage as Stage } from '../../../domain/evolution';
import { Pokemon } from '../../../domain/pokemon';
import { SpriteImage } from '../../../shared/ui/sprite-image/sprite-image';
import { EvolutionStage } from '../evolution-stage/evolution-stage';

/**
 * The Evolution tab body. Lazily fed by the detail, it shows a per-tab loading and
 * error state, the line laid out one step per row (from → method → to) so
 * branches wrap, or a friendly "does not evolve" note for a lone Pokémon. A tap on
 * a stage bubbles out so the page can push that Pokémon's detail.
 */
@Component({
  selector: 'app-evolution-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, SpriteImage, EvolutionStage],
  templateUrl: './evolution-tab.html',
  styleUrl: './evolution-tab.scss',
})
export class EvolutionTab {
  readonly pokemon = input.required<Pokemon>();
  readonly status = input.required<EvolutionStatus>();
  readonly chain = input<EvolutionChain | undefined>(undefined);
  readonly retry = output<void>();
  readonly selectStage = output<number>();

  /** The evolution steps, or none when the line isn't loaded or doesn't evolve. */
  protected readonly steps = computed(() => this.chain()?.steps ?? []);

  /** Whether a stage is the Pokémon being viewed (matched by species id). */
  protected isCurrent(stage: Stage): boolean {
    return stage.speciesId === this.pokemon().speciesId;
  }
}
