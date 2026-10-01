import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import { CONNECTIVITY } from '../data/platform/connectivity';

/**
 * The device's connectivity, exposed as a signal that flips when the platform
 * reports a change. Lets the retry backoff interceptor fail fast while offline,
 * and lets views swap to the offline state and auto recover on reconnect. Where
 * the answer comes from is the adapter's business, the platform's own network
 * state in a native shell or the browser's events on the web, so this one signal
 * reads the same either way.
 */
@Injectable({ providedIn: 'root' })
export class NetworkService {
  // Both adapters report synchronously when the watch starts, so this opening
  // value only stands in for the moment before that.
  private readonly _online = signal(true);

  /** True when the device is reachable, flips as the platform reports changes. */
  readonly online = this._online.asReadonly();

  constructor() {
    const stopWatching = inject(CONNECTIVITY).watch((online) => this._online.set(online));
    inject(DestroyRef).onDestroy(stopWatching);
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
}
