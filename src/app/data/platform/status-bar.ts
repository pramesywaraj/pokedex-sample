import { InjectionToken } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/** The colour the status bar draws its clock and icons in. */
export type StatusBarContentColour = 'black' | 'white';

/**
 * The one thing the app asks of the device status bar, which colour to draw its
 * clock and icons in, so they stay legible over whatever a screen runs behind
 * them. Behind a seam so tests can watch the calls without reaching a plugin
 * that only answers on a device.
 */
export interface StatusBarContent {
  /** Draws the clock and icons in the given colour. */
  setContentColour(colour: StatusBarContentColour): void;
}

/** The real status bar, over the Capacitor plugin. No-ops on the web build. */
const capacitorStatusBar: StatusBarContent = {
  setContentColour: (colour) => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    // The plugin names each style after the background it suits, so white
    // content is its Dark style and black content its Light one.
    void StatusBar.setStyle({ style: colour === 'white' ? Style.Dark : Style.Light }).catch(
      () => undefined,
    );
  },
};

/** DI token for the status bar, so callers depend on the seam, not the plugin. */
export const STATUS_BAR_CONTENT = new InjectionToken<StatusBarContent>('STATUS_BAR_CONTENT', {
  providedIn: 'root',
  factory: () => capacitorStatusBar,
});
