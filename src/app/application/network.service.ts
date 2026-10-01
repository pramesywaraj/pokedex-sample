import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';

/**
 * The device's connectivity, exposed as a signal that flips when the browser
 * raises its online or offline events. Lets the retry backoff interceptor fail
 * fast while offline, and lets views swap to the offline state and auto recover
 * on reconnect.
 */
@Injectable({ providedIn: 'root' })
export class NetworkService {
  private readonly _online = signal(this.readInitialOnline());

  /** True when the device is reachable, flips with the browser's online or offline events. */
  readonly online = this._online.asReadonly();

  constructor() {
    const target = typeof window === 'undefined' ? null : window;
    if (!target) {
      return;
    }
    const goOnline = () => this._online.set(true);
    const goOffline = () => this._online.set(false);
    target.addEventListener('online', goOnline);
    target.addEventListener('offline', goOffline);
    inject(DestroyRef).onDestroy(() => {
      target.removeEventListener('online', goOnline);
      target.removeEventListener('offline', goOffline);
    });
  }

  /**
   * Runs the callback each time the connection flips from offline back to
   * online. Fires only on the transition, not on the initial state, so a view
   * can register a quiet retry and know it won't run on first paint when
   * already online. Must be called from an injection context so its cleanup
   * ties to the caller's lifetime.
   */
  onReconnect(callback: () => void): void {
    let wasOffline = !this._online();
    effect(() => {
      const online = this._online();
      if (online && wasOffline) {
        wasOffline = false;
        callback();
      } else if (!online) {
        wasOffline = true;
      }
    });
  }

  private readInitialOnline(): boolean {
    if (typeof navigator === 'undefined') {
      return true;
    }
    return navigator.onLine;
  }
}
