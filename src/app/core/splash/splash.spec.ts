import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPLASH_FADE_MS, SPLASH_MIN_DISPLAY_MS, hideSplash } from './splash';

describe('hideSplash', () => {
  let cover: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    cover = document.createElement('div');
    cover.id = 'splash';
    document.body.appendChild(cover);
  });

  afterEach(() => {
    cover.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps the cover up until the minimum display time when the app boots fast', async () => {
    void hideSplash(100);

    await vi.advanceTimersByTimeAsync(SPLASH_MIN_DISPLAY_MS - 100 - 1);
    expect(cover.classList.contains('splash--leaving')).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(cover.classList.contains('splash--leaving')).toBe(true);
  });

  it('starts fading straight away when the boot already took longer than the minimum', async () => {
    void hideSplash(SPLASH_MIN_DISPLAY_MS + 250);

    await vi.advanceTimersByTimeAsync(0);
    expect(cover.classList.contains('splash--leaving')).toBe(true);
    expect(cover.style.transition).toContain(`${SPLASH_FADE_MS}ms`);
  });

  it('removes the cover once the fade has played', async () => {
    const done = hideSplash(SPLASH_MIN_DISPLAY_MS);

    await vi.advanceTimersByTimeAsync(SPLASH_FADE_MS - 1);
    expect(document.getElementById('splash')).not.toBeNull();

    await vi.advanceTimersByTimeAsync(1);
    await done;
    expect(document.getElementById('splash')).toBeNull();
  });

  it('asks the native splash to fade out over the same duration', async () => {
    const hideNative = vi.fn().mockResolvedValue(undefined);

    void hideSplash(0, hideNative);
    await vi.advanceTimersByTimeAsync(SPLASH_MIN_DISPLAY_MS);

    expect(hideNative).toHaveBeenCalledWith({ fadeOutDuration: SPLASH_FADE_MS });
  });

  it('settles quietly when there is no cover on the page', async () => {
    cover.remove();

    const done = hideSplash(SPLASH_MIN_DISPLAY_MS);
    await vi.advanceTimersByTimeAsync(SPLASH_FADE_MS);

    await expect(done).resolves.toBeUndefined();
  });
});
