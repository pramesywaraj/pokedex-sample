import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonButton } from '@ionic/angular';

/**
 * The shared full-view message panel from the design, a Poké Ball icon, a bold
 * title, a muted subtitle, and an accent action button. Used for search
 * unavailable now, and reusable for later empty and not-found states. Dumb, all
 * copy comes in via inputs and the action fires an output.
 */
@Component({
  selector: 'app-state-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton],
  templateUrl: './state-screen.html',
  styleUrl: './state-screen.scss',
})
export class StateScreen {
  readonly title = input.required<string>();
  readonly message = input<string>('');
  readonly actionLabel = input<string | undefined>(undefined);
  readonly action = output<void>();
}
