import { Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

/**
 * Favourites tab. A placeholder for now, saving and viewing favourites lands
 * later.
 */
@Component({
  selector: 'app-favourites',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
  templateUrl: './favourites.page.html',
})
export class FavouritesPage {}
