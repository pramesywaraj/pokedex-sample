import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NetworkService } from './network.service';

describe('NetworkService', () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'onLine');

  function setNavigatorOnline(value: boolean): void {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => value,
    });
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

  it('starts from navigator.onLine', () => {
    setNavigatorOnline(false);
    const service = TestBed.runInInjectionContext(() => new NetworkService());
    expect(service.online()).toBe(false);
  });

  it('flips to offline when the window raises an offline event', () => {
    setNavigatorOnline(true);
    const service = TestBed.runInInjectionContext(() => new NetworkService());
    window.dispatchEvent(new Event('offline'));
    expect(service.online()).toBe(false);
  });

  it('flips back to online on reconnect', () => {
    setNavigatorOnline(false);
    const service = TestBed.runInInjectionContext(() => new NetworkService());
    window.dispatchEvent(new Event('online'));
    expect(service.online()).toBe(true);
  });

  it('fires onReconnect only on the offline to online transition', () => {
    setNavigatorOnline(true);
    const service = TestBed.runInInjectionContext(() => new NetworkService());
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
