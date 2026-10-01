import { InjectionToken } from '@angular/core';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * The two things the native shell is asked for around the back button, claiming
 * the press and leaving the app. Behind a seam so tests can watch both without
 * calling into a plugin that only answers on a device.
 */
export interface NativeBackHost {
  /** Tells the shell that the web layer answers the back button from now on. */
  claimBackButton(): void;
  /** Leaves the app, which is what Android expects from back at a tab root. */
  exit(): void;
}

/** The real shell, over the Capacitor App plugin. No-ops on the web build. */
const capacitorBackHost: NativeBackHost = {
  claimBackButton: () => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    // Android steps the WebView's own history unless the web layer has claimed
    // the press, which this registration does. The handler stays empty on
    // purpose, because the press is answered off Ionic's queue instead.
    void App.addListener('backButton', () => undefined).catch(() => undefined);
  },
  exit: () => void App.exitApp().catch(() => undefined),
};

/** DI token for the shell, so callers depend on the seam, not the plugin. */
export const NATIVE_BACK_HOST = new InjectionToken<NativeBackHost>('NATIVE_BACK_HOST', {
  providedIn: 'root',
  factory: () => capacitorBackHost,
});
