import { Capacitor } from '@capacitor/core';
import { BrowserConnectivity } from './browser.connectivity';
import { CapacitorNetworkConnectivity } from './capacitor-network.connectivity';
import type { Connectivity } from './connectivity';

/**
 * Picks the connectivity adapter for where the app is running. Inside a native
 * shell that is the platform's own network state, on the web it is the browser's
 * online and offline events.
 */
export function platformConnectivity(): Connectivity {
  return Capacitor.isNativePlatform()
    ? new CapacitorNetworkConnectivity()
    : new BrowserConnectivity();
}
