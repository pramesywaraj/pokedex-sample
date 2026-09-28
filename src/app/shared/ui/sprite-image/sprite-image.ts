import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

/**
 * A dumb image primitive that swaps to a neutral placeholder if the source fails
 * to load, so a broken artwork/sprite never shows the browser's broken-image
 * icon. Alt text is required.
 */
@Component({
  selector: 'app-sprite-image',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sprite-image.html',
  styleUrl: './sprite-image.scss',
})
export class SpriteImage {
  readonly src = input.required<string>();
  readonly alt = input.required<string>();

  /** Flips to the placeholder once the image errors. */
  protected readonly failed = signal(false);

  /** Marks the image as failed so the template shows the placeholder instead. */
  protected onError(): void {
    this.failed.set(true);
  }
}
