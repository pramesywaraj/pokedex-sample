# 0004 — Navigate by the list endpoint's order, not id arithmetic

PokeAPI lists **1351** Pokémon entries: 1025 base Pokémon (ids/Dex numbers 1–1025) plus
326 alternate Forms parked at ids **10001+**. The ids are therefore **not contiguous** —
after 1025 the next entry is 10001, with nothing in between. The Pokédex covers **all
1351**, ordered by the list endpoint.

Consequently, both **infinite-scroll browse** and **detail swipe/prev-next** move by
**position in the list endpoint's order**, never by id arithmetic. `currentId + 1` is wrong:
from 1025 it yields 1026, which is a **404**.

Browse follows the response's `next` page link. Swipe uses a **single path**: a lightweight
index ("phone book" — `{name, url}` for every entry, ~100 KB) is loaded **once at startup**
and cached, and the neighbour is the adjacent item at position ±1 in that in-memory index;
its full profile is fetched on demand. The index is loaded via **count-then-fetch**
(`GET /pokemon?limit=1` to read `count`, then `GET /pokemon?limit={count}`) so no hardcoded
limit can ever silently truncate as the dex grows. On a cold deep-link the prev/next arrows
show a loading state until the startup index load lands.

## Consequences

- One ordered source (the startup-loaded index) drives detail swipe; browse paging follows
  the same list endpoint's `next` links.
- The `count`-driven fetch means the loader adapts to any future dex size with no magic number.
- Form entries have no clean Dex number, so they display their own id and a title-cased,
  de-hyphenated name (e.g. `charizard-mega-x` → "Charizard Mega X").
- Detail swipe is only wired to the **global browse feed** in v1; walking a subset
  (Favourites / Type filter / search) is the deferred context-aware-swipe stretch.
- Recorded so a future reader does not "simplify" navigation to `id + 1` and reintroduce
  404s at the gap, nor hardcode a fixed `limit`.
