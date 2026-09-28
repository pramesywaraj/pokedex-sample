import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBack } from 'ionicons/icons';
import { PokeballBackdrop } from '../../../shared/ui/pokeball-backdrop/pokeball-backdrop';

addIcons({ arrowBack });

/**
 * The not-found detail, shown when an id 404s.
 */
@Component({
  selector: 'app-not-found-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon, IonButton, PokeballBackdrop],
  templateUrl: './not-found-detail.html',
  styleUrl: './not-found-detail.scss',
})
export class NotFoundDetail {
  readonly back = output<void>();
  readonly goToBrowse = output<void>();
}
