import { afterEach, describe, expect, it } from 'vitest';
import { BrowserConnectivity } from './browser.connectivity';

describe('BrowserConnectivity', () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'onLine');
  const teardowns: (() => void)[] = [];

  function setNavigatorOnline(value: boolean): void {
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => value });
  }

  function watch(): boolean[] {
    const reported: boolean[] = [];
    teardowns.push(new BrowserConnectivity().watch((online) => reported.push(online)));
    return reported;
  }

  afterEach(() => {
    teardowns.splice(0).forEach((stop) => stop());
    if (originalDescriptor) {
      Object.defineProperty(window.navigator, 'onLine', originalDescriptor);
    }
  });

  it('reports what navigator says as soon as it starts watching', () => {
    setNavigatorOnline(false);
    expect(watch()).toEqual([false]);
  });

  it('reports the browser offline and online events', () => {
    setNavigatorOnline(true);
    const reported = watch();
    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));
    expect(reported).toEqual([true, false, true]);
  });

  it('stops reporting once torn down', () => {
    setNavigatorOnline(true);
    const reported: boolean[] = [];
    const stop = new BrowserConnectivity().watch((online) => reported.push(online));
    stop();
    window.dispatchEvent(new Event('offline'));
    expect(reported).toEqual([true]);
  });
});
