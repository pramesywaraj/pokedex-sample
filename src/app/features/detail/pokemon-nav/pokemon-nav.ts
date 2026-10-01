import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IonIcon, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronBack, chevronForward } from 'ionicons/icons';

addIcons({ chevronBack, chevronForward });

/**
 * Prev/next chevron buttons flanking the detail artwork. Dumb, it takes whether
 * nav is on at all, whether the phonebook index is ready yet, and the ids on
 * either side, and emits prev or next when a side is tappable. A disabled side
 * stays visible but dimmed so the Trainer sees where the controls are even
 * when nothing can happen and a shared spinner shows in place of either
 * chevron while the index is still loading.
 */
@Component({
  selector: 'app-pokemon-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon, IonSpinner],
  templateUrl: './pokemon-nav.html',
  styleUrl: './pokemon-nav.scss',
})
export class PokemonNav {
  /** False from Favourites, an active Type filter or search, so both sides stay dimmed. */
  readonly enabled = input.required<boolean>();
  /** True once the phonebook index has loaded, so prev/next can leave the loading state. */
  readonly indexReady = input<boolean>(false);
  /** Previous entry id in list order, undefined at the start of the Dex. */
  readonly prevId = input<number | undefined>(undefined);
  /** Next entry id in list order, undefined at the end of the Dex. */
  readonly nextId = input<number | undefined>(undefined);
  /** Emitted on a tap of the prev/next chevron, when prev/next is tappable. */
  readonly prev = output<void>();
  readonly next = output<void>();

  /** True when nav is on in principle but the index hasn't landed yet. */
  protected readonly loading = computed(() => this.enabled() && !this.indexReady());

  protected readonly prevDisabled = computed(
    () => !this.enabled() || this.loading() || this.prevId() === undefined,
  );
  protected readonly nextDisabled = computed(
    () => !this.enabled() || this.loading() || this.nextId() === undefined,
  );

  /** Fires the prev output when the side is tappable. */
  protected onPrev(): void {
    if (!this.prevDisabled()) {
      this.prev.emit();
    }
  }

  /** Fires the next output when the side is tappable. */
  protected onNext(): void {
    if (!this.nextDisabled()) {
      this.next.emit();
    }
  }
}
