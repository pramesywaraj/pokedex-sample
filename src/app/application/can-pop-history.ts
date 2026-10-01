/**
 * Whether there is somewhere in the app to step back to, read from the router's
 * navigation state. A cold deep-link or a page refresh lands on the very first
 * navigation with nothing behind it, and Back has to go to Browse instead of
 * popping. The header chevron and the Android hardware back both ask this, so
 * the two inputs can never disagree.
 */
export function canPopHistory(state: unknown): boolean {
  const navigationId = (state as { navigationId?: number } | null)?.navigationId;
  return navigationId !== undefined && navigationId > 1;
}
