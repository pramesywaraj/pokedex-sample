import { Capacitor } from '@capacitor/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrowserConnectivity } from './browser.connectivity';
import { CapacitorNetworkConnectivity } from './capacitor-network.connectivity';
import { platformConnectivity } from './platform-connectivity';

describe('platformConnectivity', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the platform network state inside a native shell', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    expect(platformConnectivity()).toBeInstanceOf(CapacitorNetworkConnectivity);
  });

  it('stays on the browser events on the web', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
    expect(platformConnectivity()).toBeInstanceOf(BrowserConnectivity);
  });
});
