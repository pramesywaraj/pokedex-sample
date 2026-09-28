# 0007 — Keep the name index ("phone book") separate from the Type map

The app relies on two in-memory lookups, each fed by a different PokeAPI endpoint:

- **The name index (the "phone book").** One call, `GET /pokemon?limit={count}`, returns
  every Pokémon's **name + number** (~100 KB). It powers **search** (type "char" → find
  Charmander) and **swipe** (which Pokémon comes next on the detail page). See
  [ADR 0001](./0001-hybrid-loaders-behind-one-source.md) and
  [ADR 0004](./0004-navigate-by-list-order-not-id-arithmetic.md).
- **The Type map.** The `GET /type/{type}` calls build a `number → Type(s)` lookup that powers
  the **Type filter** and **colours the Browse cards**. See
  [ADR 0006](./0006-background-type-map-for-coloured-browse-cards.md).

A natural question came up: since every Pokémon appears somewhere in the Type data, why keep
the phone book at all? Couldn't we build **one** index out of the Type calls and drop the
separate phone-book calls entirely?

We checked, and the merge is genuinely **feasible**:

- Adding up all the Type lists gives **exactly 1351 Pokémon — every entry, Forms included**.
  Nothing is missing.
- The list is easy to put in the right order: PokeAPI's browse order is simply **sorted by
  number** (…1024, 1025, then Forms at 10001, 10002…). So we could rebuild the correct order
  by sorting — no guesswork, no drift.

So it *would* work. We still decided **against** merging them, and to **keep the two
lookups separate**, for two reasons.

**1. A single failed request would silently lose Pokémon.** If the phone book were built out
of the Type calls, then one failed Type download would drop **every Pokémon of that type**
from the index — and search and swipe would quietly skip them, with nothing looking broken.
Building the phone book from its **own single call** means it either loads completely or fails
loudly — no silent holes. Keeping the Type map separate also means a failed Type call is
**harmless**: a few cards just stay grey. The same network hiccup has a tiny blast radius
instead of a serious, invisible one.

**2. Search would come alive later.** The phone book is **one** quick call, so search works
seconds after launch. If search depended on the Type map, it couldn't work until **all** the
Type calls finished — noticeably slower for a core Pokédex feature.

## How the calls flow (the agreed plan)

**At startup — get the app usable fast (2 small calls):**

1. `GET /pokemon?limit=1` — reads one number, the **total count** (1351), so we never hardcode
   a limit that goes stale as PokeAPI grows.
2. `GET /pokemon?limit={count}` — the full **phone book**. The moment it lands, **search and
   swipe work**.

**When the Browse tab opens (runs alongside the above, doesn't wait):**

3. `GET /pokemon?offset=0&limit=20` (then 40, 60… while scrolling). Card **images need no
   call** — the URL is built from the number and loads straight from the sprite CDN. The
   "next" link tells us when to stop, so browsing never needs the total count.

**In the background, right after the phone book and first Browse page — the card colours:**

4. The Type calls. PokeAPI lists **21 types, but 3 are empty** (`stellar`, `unknown`,
   `shadow`), so we hit the **18** real ones: `GET /type/fire`, `/type/water`, … These build
   the `number → Type(s)` map. Cards render **immediately in neutral grey** and **colour in**
   as the map fills. This runs off to the side and **never blocks scrolling or search**.

We fire this warm-up **right after** the phone book and first Browse page — not bundled in with
them at startup. The browser only downloads about **six things at once**, so firing everything
together would make the Type calls compete with the cards and search for those slots, and the
app would feel *slower* to become usable. Get the essentials first, then warm the Types.

**When the user taps a Type filter (on demand):**

5. `GET /type/{type}`. If the background warm-up already loaded it, it's **cached → the filter
   is instant**. If not, the filter fetches that one Type itself, shows a **skeleton** while it
   loads, then the results — and caches it (so the colour map benefits too).

### The edge case: filtering before the colours have loaded

Because the filter has its **own** on-demand fetch (step 5), filtering *never depends* on the
background warm-up. Worst case, a user taps a filter before its Type has loaded and sees a
**brief skeleton, then results** — exactly what the very first filter of any session does.
Nothing is missing, nothing errors. The background warm-up is purely an **optimisation** that
makes filtering feel instant *more often*.

### How already-rendered cards get their colour

Cards don't store a colour — they **read** it from the shared Type map, which is a reactive
value ([ADR 0005](./0005-signals-over-ngrx.md)). A card shows grey while its number isn't in
the map yet, and **re-colours itself the instant the map updates** — even if it was already on
screen. So it makes no difference whether a card was drawn before or after the Type data
arrived; there's no "go back and fix the old cards" logic to write.

## Considered options

- **One merged, Type-driven index** (the idea above). Feasible — the Type data is complete and
  sorts into the right order — but rejected: a single failed Type call silently loses Pokémon
  from search, and search would wait on all 18 calls instead of one.
- **Keep them separate** (chosen). One extra small call for the phone book, in exchange for
  fast search and failures that stay harmless.

## Consequences

- The phone book is the **single source of truth** for the Pokémon list, its order, search,
  and swipe. It loads from its own one call and is complete-or-failed — never half-populated.
- The **18 Type calls are still made** (for colour and filter), so keeping the phone book costs
  only the **two small `/pokemon` index calls** on top — a deliberate, cheap trade for
  robustness and speed.
- Everything above is **cached** via the async cache seam
  ([ADR 0003](./0003-async-cache-seam.md)); returning to Browse later refetches nothing.
- The two lookups reinforce, rather than duplicate, [ADR 0006](./0006-background-type-map-for-coloured-browse-cards.md):
  that ADR already reuses the Type calls for both colour and filter; this ADR records **why we
  stopped short** of reusing them for the core index too.
