# 0003 — Persistent async cache from v1 (behind one seam)

All Pokémon data access goes through a **single cache interface** whose methods are
**asynchronous**, and in v1 it is backed by **persistent Ionic Storage** (IndexedDB on
web/desktop and native by default). So fetched data — the phone-book index, Pokémon, species,
evolution, Type sets — **survives app reopen**: repeat launches are a **warm start** with no
re-fetch of what's already been seen.

The async signature is what makes this safe and swappable: disk storage cannot answer
synchronously, so writing every caller against an async seam from the start means the backing
store (in-memory, IndexedDB, or a future native SQLite driver) can change with **no caller
changes**. Paying the async cost up front is what let us pull persistence *into* v1 cheaply.

**What "persistent" does and doesn't buy.** It gives warm starts and makes previously fetched
*data* available without re-fetching. It does **not** make the app work offline, because
card/sprite **images** load straight from the PokeAPI CDN and are not in this cache. **True
offline** — caching images too (service worker on web / filesystem on native) — remains stretch
**S1**; it is additive on this same seam.

## Considered options

- **In-memory only in v1, persist later.** The original plan. Rejected once we saw the persist
  swap was cheap on the async seam and the warm-start UX win was large — the seam had already
  de-risked it.
- **Persist *and* cache images now (full offline).** The bigger prize, but it needs a service
  worker / filesystem layer plus offline expectation-handling — deferred to S1 to protect scope.

## Consequences

- The cache needs **versioning**: a `cacheVersion` stored with the data; on mismatch (or absent)
  the data cache is **cleared** and rebuilt cold. **Favourites live in a separate store and are
  never cleared.**
- Data is **immutable reference data** → cached indefinitely, no TTL. The dex is bounded (a few
  MB), so **no eviction**; a failed cache write is swallowed (the app still works from network).
- Recorded so a future reader does not "simplify" the async interface away, nor assume the app is
  offline-capable just because the cache is persistent.
