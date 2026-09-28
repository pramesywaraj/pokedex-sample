import { CACHE_VERSION_KEY, applyCacheVersion } from './cache';
import { InMemoryCache } from './in-memory.cache';

describe('InMemoryCache', () => {
  it('returns undefined for a missing key and round-trips a stored value', async () => {
    const cache = new InMemoryCache();
    expect(await cache.get('pokemon:6')).toBeUndefined();
    await cache.set('pokemon:6', { id: 6 });
    expect(await cache.get('pokemon:6')).toEqual({ id: 6 });
  });

  it('drops everything on clear', async () => {
    const cache = new InMemoryCache();
    await cache.set('pokemon:6', { id: 6 });
    await cache.clear();
    expect(await cache.get('pokemon:6')).toBeUndefined();
  });
});

describe('applyCacheVersion', () => {
  it('clears stale data and stamps the new version on a mismatch', async () => {
    const cache = new InMemoryCache();
    await cache.set(CACHE_VERSION_KEY, '0');
    await cache.set('pokemon:6', { id: 6 });

    await applyCacheVersion(cache, '1');

    expect(await cache.get('pokemon:6')).toBeUndefined();
    expect(await cache.get(CACHE_VERSION_KEY)).toBe('1');
  });

  it('stamps the version on a first, unversioned launch', async () => {
    const cache = new InMemoryCache();
    await applyCacheVersion(cache, '1');
    expect(await cache.get(CACHE_VERSION_KEY)).toBe('1');
  });

  it('keeps cached data when the version already matches', async () => {
    const cache = new InMemoryCache();
    await cache.set(CACHE_VERSION_KEY, '1');
    await cache.set('pokemon:6', { id: 6 });

    await applyCacheVersion(cache, '1');

    expect(await cache.get('pokemon:6')).toEqual({ id: 6 });
  });
});
