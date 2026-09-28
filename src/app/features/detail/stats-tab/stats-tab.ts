import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { StatSet } from '../../../domain/stat-set';
import { StatBar } from '../../../shared/ui/stat-bar/stat-bar';

/** One labelled stat row for the tab, the display name and its value. */
interface StatRow {
  label: string;
  value: number;
}

/**
 * The Base Stats tab body, the six base stats as bars over a Total row. Values
 * come straight from the already-fetched Pokémon, so it makes no request, the
 * bars grow in when the tab opens (each StatBar animates on mount).
 */
@Component({
  selector: 'app-stats-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatBar],
  templateUrl: './stats-tab.html',
  styleUrl: './stats-tab.scss',
})
export class StatsTab {
  readonly stats = input.required<StatSet>();

  /** The six stats in dex order, mapped to display labels. */
  protected readonly rows = computed<StatRow[]>(() => {
    const s = this.stats();
    return [
      { label: 'HP', value: s.hp },
      { label: 'Attack', value: s.attack },
      { label: 'Defense', value: s.defense },
      { label: 'Sp. Atk', value: s.specialAttack },
      { label: 'Sp. Def', value: s.specialDefense },
      { label: 'Speed', value: s.speed },
    ];
  });

  /** The summed total, shown on its own row below the bars. */
  protected readonly total = computed(() => this.stats().total);
}
