import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HardwareBackService } from './hardware-back.service';
import { NATIVE_BACK_HOST } from './native-back-host';

/** Stands in for the real pages, so the test router has somewhere to land. */
@Component({ template: '' })
class BlankPage {}

describe('HardwareBackService', () => {
  const shell = { claimBackButton: vi.fn(), exit: vi.fn() };
  let router: Router;
  let location: Location;
  let back: ReturnType<typeof vi.spyOn>;
  let priorities: number[];

  /** Fires the back button the way Ionic's queue delivers it to subscribers. */
  function pressBack(): void {
    document.dispatchEvent(
      new CustomEvent('ionBackButton', {
        detail: {
          register: (priority: number, handler: () => void) => {
            priorities.push(priority);
            handler();
          },
        },
      }),
    );
  }

  /** Lands on a screen with a given depth of history behind it, then listens. */
  async function startOn(url: string, navigationId: number): Promise<void> {
    await router.navigateByUrl(url);
    vi.spyOn(location, 'getState').mockReturnValue({ navigationId });
    TestBed.inject(HardwareBackService).start();
  }

  beforeEach(() => {
    shell.claimBackButton.mockClear();
    shell.exit.mockClear();
    priorities = [];
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideIonicAngular({}),
        provideRouter([
          { path: 'tabs/browse', component: BlankPage },
          { path: 'pokemon/:id', component: BlankPage },
        ]),
        { provide: NATIVE_BACK_HOST, useValue: shell },
      ],
    });
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    back = vi.spyOn(location, 'back').mockImplementation(() => undefined);
  });

  it('pops the history when there is a screen behind this one', async () => {
    await startOn('/pokemon/25', 3);
    pressBack();
    expect(back).toHaveBeenCalled();
    expect(shell.exit).not.toHaveBeenCalled();
  });

  it('falls back to Browse from a cold deep-link with nothing to pop', async () => {
    await startOn('/pokemon/25', 1);
    pressBack();
    await vi.waitFor(() => expect(router.url).toBe('/tabs/browse'));
    expect(back).not.toHaveBeenCalled();
    expect(shell.exit).not.toHaveBeenCalled();
  });

  it('leaves the app from a tab root with nothing to pop', async () => {
    await startOn('/tabs/browse', 1);
    pressBack();
    expect(shell.exit).toHaveBeenCalled();
    expect(back).not.toHaveBeenCalled();
  });

  it('claims the press from the shell, so the platform stops handling it itself', async () => {
    await startOn('/tabs/browse', 1);
    expect(shell.claimBackButton).toHaveBeenCalled();
  });

  it('answers above the router outlet and below overlays and menus', async () => {
    await startOn('/pokemon/25', 3);
    pressBack();
    // Above the outlet's own pop at 0, below menus at 99 and overlays at 100.
    expect(priorities).toHaveLength(1);
    expect(priorities[0]).toBeGreaterThan(0);
    expect(priorities[0]).toBeLessThan(99);
  });

  it('ignores the back button until it has been started', async () => {
    await router.navigateByUrl('/pokemon/25');
    vi.spyOn(location, 'getState').mockReturnValue({ navigationId: 3 });
    pressBack();
    expect(back).not.toHaveBeenCalled();
  });
});
