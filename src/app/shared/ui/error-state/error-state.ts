import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonButton } from '@ionic/angular';

/**
 * A full-view error message with a Retry action, used wherever a fetch fails with
 * something a retry could fix. A dumb primitive, message in and retry out.
 */
@Component({
  selector: 'app-error-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton],
  templateUrl: './error-state.html',
  styleUrl: './error-state.scss',
})
export class ErrorState {
  readonly message = input('Something went wrong.');
  readonly actionLabel = input('Retry');
  readonly retry = output<void>();
}
