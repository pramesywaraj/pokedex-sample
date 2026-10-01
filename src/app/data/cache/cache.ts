import { InjectionToken } from '@angular/core';

/**
 * The persistent data-cache seam. Its methods are async so the backing store can
 * be swapped, in-memory fake, Ionic Storage (IndexedDB), a future native driver —
 * without any caller change. It holds immutable reference data (no TTL). Favourites
 * live in a separate store and are never reached through here.
 */
export interface Cache {
  /** Reads a stored value, or undefined when the key has never been written. */
  get<T>(key: string): Promise<T | undefined>;
  /** Stores a value under a key, overwriting any previous one. */
  set<T>(key: string, value: T): Promise<void>;
  /** Wipes the whole data cache; used on a cache-version mismatch. */
  clear(): Promise<void>;
}

/** DI token for the data cache, so callers depend on the seam, not an implementation. */
export const CACHE = new InjectionToken<Cache>('CACHE');

/**
 * The persisted-shape version. Bump this whenever a cached record's shape changes
 * between releases, so a stale cache is cleared and rebuilt cold on next launch.
 */
export const cacheVersion = '2';

/** The reserved key under which the cache version is stored alongside the data. */
export const CACHE_VERSION_KEY = 'cacheVersion';

/**
 * Clears and re-stamps the cache when the stored version is missing or stale, so a
 * shape change between releases can never surface half-old records. A matching
 * version is left untouched. Favourites are in a separate store, so `clear()` here
 * never touches them.
 */
export async function applyCacheVersion(cache: Cache, version = cacheVersion): Promise<void> {
  const stored = await cache.get<string>(CACHE_VERSION_KEY);
  if (stored === version) {
    return;
  }
  await cache.clear();
  await cache.set(CACHE_VERSION_KEY, version);
}
