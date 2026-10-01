import { describe, expect, it } from 'vitest';
import { canPopHistory } from './can-pop-history';

describe('canPopHistory', () => {
  it('can pop once the app has navigated past its first screen', () => {
    expect(canPopHistory({ navigationId: 2 })).toBe(true);
  });

  it('cannot pop on the first navigation, a cold deep-link or a refresh', () => {
    expect(canPopHistory({ navigationId: 1 })).toBe(false);
  });

  it('cannot pop when the router left no state behind', () => {
    expect(canPopHistory(null)).toBe(false);
    expect(canPopHistory({})).toBe(false);
  });
});
