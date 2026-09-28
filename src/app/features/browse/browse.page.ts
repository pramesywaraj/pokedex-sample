import { Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-browse',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
  templateUrl: './browse.page.html',
})
export class BrowsePage {}
