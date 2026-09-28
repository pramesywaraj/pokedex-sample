import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** The three detail sections a Trainer taps between. */
export type DetailTab = 'about' | 'stats' | 'evolution';

interface TabDef {
  key: DetailTab;
  label: string;
}

const TABS: TabDef[] = [
  { key: 'about', label: 'About' },
  { key: 'stats', label: 'Base Stats' },
  { key: 'evolution', label: 'Evolution' },
];

/**
 * The white floating tab bar over the detail panel. Tap-switched only (swipe is
 * reserved for Pokémon nav). A dumb control, the active tab comes in and taps go
 * out, the active label takes the primary Type colour from the inherited
 * `--active` var.
 */
@Component({
  selector: 'app-detail-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detail-tabs.html',
  styleUrl: './detail-tabs.scss',
})
export class DetailTabs {
  readonly active = input.required<DetailTab>();
  readonly tabChange = output<DetailTab>();

  protected readonly tabs = TABS;

  /** Emits the tapped tab unless it is already the active one. */
  protected select(tab: DetailTab): void {
    if (tab !== this.active()) {
      this.tabChange.emit(tab);
    }
  }
}
