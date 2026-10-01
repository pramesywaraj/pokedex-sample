import type { Connectivity } from './connectivity';

/**
 * Connectivity from the browser, `navigator.onLine` for the state we start on
 * and then the window's online and offline events. This is the web build's
 * adapter, and the one a desktop browser or a PWA runs on.
 */
export class BrowserConnectivity implements Connectivity {
  /** Reports the browser's state straight away, then on every event it raises. */
  watch(report: (online: boolean) => void): () => void {
    if (typeof window === 'undefined') {
      report(true);
      return () => undefined;
    }
    const goOnline = () => report(true);
    const goOffline = () => report(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    // Reported straight away, so the first paint already knows if we are offline.
    report(typeof navigator === 'undefined' || navigator.onLine);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }
}
