import { SplashScreen } from '@capacitor/splash-screen';

/** The shortest time the boot cover stays up, so a warm launch doesn't flash it. */
export const SPLASH_MIN_DISPLAY_MS = 600;

/** How long the boot cover takes to fade into the Browse skeleton. */
export const SPLASH_FADE_MS = 200;

/** Matches the overlay's id and leaving class in index.html. */
const COVER_ID = 'splash';
const LEAVING_CLASS = 'splash--leaving';

/**
 * Takes the boot cover down once Angular has bootstrapped. It waits out the
 * minimum display time, counted from page start, then fades the native splash
 * and the web overlay together and removes the overlay. It gates on nothing
 * else, so the index can still be loading underneath.
 */
export async function hideSplash(
  elapsedMs: number = performance.now(),
  hideNative: (options: { fadeOutDuration: number }) => Promise<void> = (options) =>
    SplashScreen.hide(options),
): Promise<void> {
  await wait(Math.max(0, SPLASH_MIN_DISPLAY_MS - elapsedMs));

  // The web build has no native splash and the plugin's hide is a no-op there.
  void hideNative({ fadeOutDuration: SPLASH_FADE_MS }).catch(() => undefined);

  const cover = document.getElementById(COVER_ID);
  if (!cover) {
    return;
  }
  // The fade length lives here only, so the removal below can never cut it short.
  cover.style.transition = `opacity ${SPLASH_FADE_MS}ms ease`;
  cover.classList.add(LEAVING_CLASS);
  await wait(SPLASH_FADE_MS);
  cover.remove();
}

/** Resolves after the given number of milliseconds. */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
