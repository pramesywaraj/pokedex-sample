import { Location } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { canPopHistory } from '../../application/can-pop-history';
import { NATIVE_BACK_HOST } from './native-back-host';

/**
 * Where our handler sits in Ionic's back button queue. It is above the router
 * outlet's own pop at 0, so that one never also fires and double navigates, and
 * below overlays at 100 and menus at 99, so an open sheet still closes on the
 * first press.
 */
const BACK_BUTTON_PRIORITY = 10;

/**
 * Honours the Android hardware back button. It is a separate input from the
 * header chevron, so it is wired once for the whole app rather than per page,
 * and it answers a press the same way the chevron does. It pops the screen
 * behind this one, falls back to Browse when a cold deep-link left nothing to
 * pop, and only leaves the app from a tab root. Because a swipe between
 * neighbours replaces the URL, a Trainer who swiped across ten entries is still
 * one press from Browse.
 */
@Injectable({ providedIn: 'root' })
export class HardwareBackService {
  private readonly platform = inject(Platform);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly shell = inject(NATIVE_BACK_HOST);
  private readonly destroyRef = inject(DestroyRef);

  /** Starts answering the back button. Called once from the app shell. */
  start(): void {
    const press = this.platform.backButton.subscribeWithPriority(BACK_BUTTON_PRIORITY, () =>
      this.goBack(),
    );
    this.destroyRef.onDestroy(() => press.unsubscribe());
    this.shell.claimBackButton();
  }

  /** The one back decision, pop, fall back to Browse, or leave the app. */
  private goBack(): void {
    if (canPopHistory(this.location.getState())) {
      this.location.back();
    } else if (this.isTabRoot()) {
      this.shell.exit();
    } else {
      void this.router.navigate(['/tabs/browse']);
    }
  }

  /** Whether we are on one of the two tabs, the only place back may leave the app. */
  private isTabRoot(): boolean {
    return this.router.url.startsWith('/tabs');
  }
}
