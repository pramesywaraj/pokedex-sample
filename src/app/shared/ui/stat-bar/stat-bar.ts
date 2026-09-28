import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** The base-stat value a full bar represents, higher stats cap at a full bar. */
export const STAT_BAR_MAX = 150;

/**
 * One labelled stat bar, a name and value beside a track whose red-coral fill
 * grows in proportion to the value. A dumb primitive, the label takes its colour
 * from the inherited `--stat-label-color` var so a Type can tint it, the fill
 * grows in on mount via CSS.
 */
@Component({
  selector: 'app-stat-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stat-bar.html',
  styleUrl: './stat-bar.scss',
})
export class StatBar {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  /** The value a full bar represents, defaults to the shared stat ceiling. */
  readonly max = input(STAT_BAR_MAX);

  /** The fill width as a percentage, clamped so a huge stat never overflows. */
  protected readonly fillPercent = computed(
    () => `${Math.min(this.value() / this.max(), 1) * 100}%`,
  );
}
