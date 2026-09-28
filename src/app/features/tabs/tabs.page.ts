import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { apps, heart } from 'ionicons/icons';

// Register the tab-bar icons once for the app, not per component instance.
addIcons({ apps, heart });

/**
 * The app's two-tab shell (Browse · Favourites). Hosts the bottom tab bar and
 * the inner outlet each tab's page renders into (ARCHITECTURE §7).
 */
@Component({
  selector: 'app-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  templateUrl: './tabs.page.html',
})
export class TabsPage {}
