import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';

/**
 * The app level 404 for any url the router doesn't know. Separate from the
 * mystery Pokémon state, which is for an id that doesn't exist, this one only
 * offers a way back to Browse.
 */
@Component({
  selector: 'app-page-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, IonButton],
  templateUrl: './page-not-found.page.html',
  styleUrl: './page-not-found.page.scss',
})
export class PageNotFoundPage {
  private readonly router = inject(Router);

  /** Sends the Trainer back to the Browse tab. */
  protected goToBrowse(): Promise<boolean> {
    return this.router.navigate(['/tabs/browse']);
  }
}
