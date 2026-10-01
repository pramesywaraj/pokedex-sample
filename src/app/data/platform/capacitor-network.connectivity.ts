import { Network } from '@capacitor/network';
import type { Connectivity } from './connectivity';

/**
 * Connectivity from the native platform, read through the Capacitor Network
 * plugin. Inside a native shell this is the real answer, where `navigator.onLine`
 * only tells us the WebView has an interface and says nothing about whether the
 * device can reach the internet.
 */
export class CapacitorNetworkConnectivity implements Connectivity {
  /** Reports the browser's guess, then the platform's answer and every change. */
  watch(report: (online: boolean) => void): () => void {
    let watching = true;
    // The platform only answers a tick later, so open on what the WebView thinks
    // rather than leave callers guessing, then correct it below.
    report(typeof navigator === 'undefined' || navigator.onLine);

    void Network.getStatus()
      .then((status) => {
        if (watching) {
          report(status.connected);
        }
      })
      .catch(() => undefined);

    const listener = Network.addListener('networkStatusChange', (status) => {
      if (watching) {
        report(status.connected);
      }
    });

    return () => {
      watching = false;
      void listener.then((handle) => handle.remove()).catch(() => undefined);
    };
  }
}
