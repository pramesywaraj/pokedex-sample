# 0003 — Async cache seam: in-memory now, persistent later

All Pokémon data access goes through a **single cache interface** whose methods are
**asynchronous from day one**, even though v1 backs it with a plain in-memory store.
This lets us swap the backing store to persistent Ionic Storage later (for instant repeat
launches and true offline) with **no changes to any caller**.

The async signature is the whole point: an in-memory map answers instantly, but disk
storage does not. Writing callers against a synchronous store now would force a rewrite of
every call site when we move to disk. Paying the async cost up front makes the later swap a
drop-in.

## Consequences

- v1 cache resets on app restart; that is acceptable and keeps scope tight.
- Persistent offline caching becomes an additive change (one new adapter + a provider
  swap), recorded here so a future reader does not "simplify" the async interface away.
