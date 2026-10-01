import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserConnectivity } from '../data/platform/browser.connectivity';
import type { Connectivity } from '../data/platform/connectivity';
import { CONNECTIVITY } from '../data/platform/connectivity';
import { NetworkService } from './network.service';

describe('NetworkService', () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'onLine');

  function setNavigatorOnline(value: boolean): void {
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => value });
  }

  /** Stands in for a native platform: nothing is reported until the test says so. */
  function platformConnectivity(): { adapter: Connectivity; report: (online: boolean) => void } {
    let report: (online: boolean) => void = () => undefined;
    return {
      adapter: {
        watch: (reportOnline) => {
          report = reportOnline;
          return () => (report = () => undefined);
        },
      },
      report: (online) => report(online),
    };
  }

  function serviceOver(adapter: Connectivity): NetworkService {
    TestBed.configureTestingModule({ providers: [{ provide: CONNECTIVITY, useValue: adapter }] });
    return TestBed.inject(NetworkService);
  }

  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(window.navigator, 'onLine', originalDescriptor);
    }
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('starts from navigator.onLine on the web', () => {
    setNavigatorOnline(false);
    expect(serviceOver(new BrowserConnectivity()).online()).toBe(false);
  });

  it('flips to offline when the web adapter reports a disconnect', () => {
    setNavigatorOnline(true);
    const service = serviceOver(new BrowserConnectivity());
    window.dispatchEvent(new Event('offline'));
    expect(service.online()).toBe(false);
  });

  it('flips back to online on reconnect', () => {
    setNavigatorOnline(false);
    const service = serviceOver(new BrowserConnectivity());
    window.dispatchEvent(new Event('online'));
    expect(service.online()).toBe(true);
  });

  it('follows the platform state on native, not navigator.onLine', () => {
    // A native WebView can hold an interface while the platform has no route out.
    setNavigatorOnline(true);
    const platform = platformConnectivity();
    const service = serviceOver(platform.adapter);
    platform.report(false);
    expect(service.online()).toBe(false);
    platform.report(true);
    expect(service.online()).toBe(true);
  });

  it('assumes online until the platform has reported', () => {
    const service = serviceOver(platformConnectivity().adapter);
    expect(service.online()).toBe(true);
  });

  it('stops watching when the injector is destroyed', () => {
    const stop = vi.fn();
    serviceOver({ watch: () => stop });
    TestBed.resetTestingModule();
    expect(stop).toHaveBeenCalled();
  });

  it('fires onReconnect only on the offline to online transition', () => {
    setNavigatorOnline(true);
    const service = serviceOver(new BrowserConnectivity());
    const calls: number[] = [];
    TestBed.runInInjectionContext(() => service.onReconnect(() => calls.push(1)));
    TestBed.tick();
    expect(calls).toHaveLength(0);
    window.dispatchEvent(new Event('offline'));
    TestBed.tick();
    window.dispatchEvent(new Event('online'));
    TestBed.tick();
    expect(calls).toHaveLength(1);
  });
});
