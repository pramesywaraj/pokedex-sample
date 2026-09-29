import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { heart, heartOutline } from 'ionicons/icons';

addIcons({ heart, heartOutline });

/**
 * A heart toggle used on the Detail header. Dumb primitive, whether it's on
 * comes in as `active`, taps go out as `toggle`. The parent owns state, so the
 * button reflects the store optimistically and follows it back if a write fails.
 */
@Component({
  selector: 'app-favourite-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon],
  templateUrl: './favourite-button.html',
  styleUrl: './favourite-button.scss',
})
export class FavouriteButton {
  readonly active = input.required<boolean>();
  readonly toggled = output<void>();

  protected readonly iconName = computed(() => (this.active() ? 'heart' : 'heart-outline'));
  protected readonly label = computed(() =>
    this.active() ? 'Remove from favourites' : 'Add to favourites',
  );
}
