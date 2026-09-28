import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IonButton } from '@ionic/angular';
import { Pokemon } from '../../../domain/pokemon';
import { DescriptionStatus } from '../../../application/detail.service';

/**
 * The About tab body, the Pokédex description over its height, weight and
 * abilities. Height, weight and abilities come from the core Pokémon and are
 * always present here. The description rides the species read, so it carries its
 * own loading and per-tab error while the rest of the tab stays usable.
 */
@Component({
  selector: 'app-about-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton],
  templateUrl: './about-tab.html',
  styleUrl: './about-tab.scss',
})
export class AboutTab {
  readonly pokemon = input.required<Pokemon>();
  readonly description = input<string | undefined>(undefined);
  readonly descriptionStatus = input.required<DescriptionStatus>();
  readonly retryDescription = output<void>();

  /** Height in metres to one decimal, e.g. "0.7 m". */
  protected readonly heightLabel = computed(() => `${this.pokemon().heightM.toFixed(1)} m`);
  /** Weight in kilograms to one decimal, e.g. "6.9 kg". */
  protected readonly weightLabel = computed(() => `${this.pokemon().weightKg.toFixed(1)} kg`);
  /** The abilities as a middot-separated list, e.g. "Overgrow · Chlorophyll". */
  protected readonly abilitiesLabel = computed(() => this.pokemon().abilities.join(' · '));
}
