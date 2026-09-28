import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

/** Root shell: the Ionic app frame hosting the top-level router outlet. */
@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet],
  templateUrl: './app.html',
})
export class App {}
