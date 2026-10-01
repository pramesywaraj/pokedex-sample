import { InjectionToken } from '@angular/core';

/**
 * How the app learns whether it can reach the network. Behind this seam sit the
 * browser's online and offline events on the web, and the platform's own network
 * state inside a native shell, so nothing above has to know which one it is
 * running in.
 */
export interface Connectivity {
  /**
   * Starts reporting the connection state, once with what the platform says
   * right now and then again on every change. Returns the teardown that stops
   * the reporting.
   */
  watch(report: (online: boolean) => void): () => void;
}

/** DI token for connectivity, so callers depend on the seam, not an implementation. */
export const CONNECTIVITY = new InjectionToken<Connectivity>('CONNECTIVITY');
