import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { IonButton } from '@ionic/angular';

/**
 * The empty state for the Favourites tab, a friendly Poké Ball, a one-line hint
 * on how to save, and the Go-to-Browse action.
 */
@Component({
  selector: 'app-empty-favourites',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton],
  templateUrl: './empty-favourites.html',
  styleUrl: './empty-favourites.scss',
})
export class EmptyFavourites {
  readonly goToBrowse = output<void>();
}
