import { Injectable, inject } from '@angular/core';
import { STATUS_BAR_CONTENT, type StatusBarContentColour } from '../data/platform/status-bar';

export type { StatusBarContentColour };

/** What the white app canvas needs behind the clock on Browse and Favourites. */
const CANVAS_COLOUR: StatusBarContentColour = 'black';

/** What the brand red boot field needs, which the native launch theme already sets. */
const BOOT_COVER_COLOUR: StatusBarContentColour = 'white';

/**
 * Keeps the device status bar readable. A screen says which colour its clock
 * and icons should take and this hands that to the platform, so a Type coloured
 * hero running under the status bar can carry white icons while the white app
 * canvas keeps dark ones.
 *
 * While the boot cover is still up the request is only remembered, because the
 * cover is brand red whatever screen is loading behind it. The first screen is
 * built long before the cover fades, so without that hold a cold open straight
 * onto a Detail would flash the canvas colour over a Type hero.
 */
@Injectable({ providedIn: 'root' })
export class StatusBarService {
  private readonly statusBar = inject(STATUS_BAR_CONTENT);

  private bootCoverUp = true;
  private wanted: StatusBarContentColour = BOOT_COVER_COLOUR;

  /** Draws the status bar clock and icons in the given colour. */
  setContentColour(colour: StatusBarContentColour): void {
    this.wanted = colour;
    if (!this.bootCoverUp) {
      this.statusBar.setContentColour(colour);
    }
  }

  /** Hands the status bar back to the dark icons the white app canvas wants. */
  resetToCanvas(): void {
    this.setContentColour(CANVAS_COLOUR);
  }

  /**
   * Lets the status bar follow the app, now the boot cover has gone, applying
   * whatever the screen underneath asked for while it was up.
   */
  bootCoverGone(): void {
    this.bootCoverUp = false;
    this.statusBar.setContentColour(this.wanted);
  }
}
