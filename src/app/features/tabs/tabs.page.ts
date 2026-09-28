import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { heart } from 'ionicons/icons';

// Register the tab-bar icons once for the app, not per component instance.
// Browse uses a custom Poké Ball SVG loaded by src, so only heart is registered.
addIcons({ heart });

/**
 * The app's two-tab shell (Browse · Favourites). Hosts the bottom tab bar and
 * the inner outlet each tab's page renders into.
 */
@Component({
  selector: 'app-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  templateUrl: './tabs.page.html',
})
export class TabsPage {}
