# Pokédex — Product Requirements Document

| | |
|---|---|
| **Status** | Draft for review |
| **Date** | 2026-09-26 |
| **Author** | jems.p14@gmail.com |
| **Type** | Take-home assessment |

> Terminology follows [`CONTEXT.md`](../CONTEXT.md). Architectural decisions are recorded
> as ADRs in [`docs/adr/`](./adr/) and referenced inline.

---

## 1. Overview

A **Pokédex** — a digital encyclopedia, in the spirit of Professor Oak's, giving Trainers
information about every Pokémon. It is a **frontend-only** application with **no backend of
our own**: all data and images come directly from the public [PokeAPI](https://pokeapi.co).

It ships from **one Angular + Ionic codebase** as both a responsive mobile-first **web** app
and **installable iOS/Android** apps via Capacitor ([ADR 0002](./adr/0002-ionic-capacitor.md)).

## 2. Goals & non-goals

**Goals**
- Let a Trainer browse **all 1351 Pokémon entries** (1025 base + 326 Forms) smoothly, without interruption.
- Let a Trainer view rich detail and images for any Pokémon.
- Let a Trainer favourite Pokémon and revisit them.
- Let a Trainer narrow the Pokédex by Type, and find a Pokémon by name/number.
- As a graded take-home: clean architecture, meaningful tests, and clear docs — every use
  case below maps to checkable acceptance criteria.

**Non-goals (v1)** — see §9 for the full list with rationale: accounts / cross-device sync,
multi-type filtering, the moves list, persistent offline caching, search autocomplete, and
end-to-end tests.

## 3. Users

**Trainer** — a single, anonymous user per device. No sign-up, no login. A Trainer's
Favourites live only on their own device.

## 4. Assumptions & constraints

- **Data source:** PokeAPI only. We respect its fair-use guidance (cache, don't hammer).
- **No backend:** Favourites persist on-device via Ionic Storage; they do **not** sync
  across devices. This is a deliberate consequence of being frontend-only, stated so a
  reviewer sees it as a trade-off, not a bug.
- **Network required in v1:** with only in-memory caching, the app needs a connection;
  no-network surfaces a friendly error state (true offline is a stretch — §9).
- **Data set:** **1351 entries** total — `/pokemon` count 1351 = 1025 base Pokémon
  (Dex numbers 1–1025) + 326 **Forms** (ids 10001+). Forms are included in browse, search,
  and filter; they display their own id and a title-cased, de-hyphenated name.
- **Ordering & navigation:** browse and detail swipe move by **position in the list
  endpoint's order**, never by id arithmetic — the ids are non-contiguous (after 1025 the
  next entry is 10001), so `id + 1` would 404 ([ADR 0004](./adr/0004-navigate-by-list-order-not-id-arithmetic.md)).
- **Filter and search are alternative modes:** turning one on clears the other.

### PokeAPI shape that drives the design ([ADR 0001](./adr/0001-hybrid-loaders-behind-one-source.md), [ADR 0004](./adr/0004-navigate-by-list-order-not-id-arithmetic.md))

| Need | Endpoint | Behaviour |
|---|---|---|
| Browse all | `GET /pokemon?offset&limit` | Pages cleanly; follow the response's `next` link to page. Returns `{name, url}` only |
| Full index ("phone book") | `GET /pokemon?limit=1` (read `count`) → `GET /pokemon?limit={count}` | Loaded **once at startup**; **count-then-fetch** so no hardcoded limit to outgrow. `{name, url}` only (~100 KB). Shared by search + swipe |
| Filter by Type | `GET /type/{type}` | Returns the **whole** Type set at once, unpaged |
| Search by name/number | `GET /pokemon/{name\|id}` | **Exact match only**; partial matching runs against the in-memory index |
| Next/previous Pokémon | in-memory index (position ±1) | Single path; steps over the id gap; used by detail swipe. Fetch the neighbour's profile on demand |
| Detail | `GET /pokemon/{id}` + `GET /pokemon-species/{id}` (+ `GET /evolution-chain/{id}`) | Two–three requests stitched together |
| Image | Sprite/artwork URLs derivable from id | No extra request for the browse card image |

## 5. Functional requirements (use cases)

Acceptance criteria use Given / When / Then and are numbered for traceability.

### UC-1 — Browse Pokémon with infinite scroll
**Actor:** Trainer · **Trigger:** opens the app (Browse tab).

A continuous, interruption-free grid of all 1351 entries in list-endpoint order. Each card
shows **Artwork + name + number** only — no per-card requests (image URL derived from id), so the scroll never
stutters ([ADR 0001](./adr/0001-hybrid-loaders-behind-one-source.md)). Paging follows the
list response's `next` link — the same ordered source that drives detail swipe
([ADR 0004](./adr/0004-navigate-by-list-order-not-id-arithmetic.md)).

- **AC-1.1** — Given the Browse tab, When it opens, Then the first page of Pokémon (in
  list-endpoint order, starting at #1) is shown as cards with Artwork, name, and number.
- **AC-1.2** — Given I scroll near the end of the loaded list, When more exist, Then the next
  page (via the `next` link) loads and appends without me acting, showing a loading indicator
  while fetching.
- **AC-1.3** — Given I have scrolled to the last Pokémon, When no more exist, Then loading
  stops and no error is shown.
- **AC-1.4** — Given the **first** page fails to load (nothing shown yet), When I am shown an
  error, Then it is a **full-view** error with retry.
- **AC-1.5** — Given a **later** page fails mid-scroll, When I am shown an error, Then it is an
  **inline** "couldn't load more — retry" at the list's end, and already-loaded cards remain.

### UC-2 — View Pokémon detail (tabs + swipe navigation)
**Actor:** Trainer · **Trigger:** taps a card, taps an Evolution stage, or opens a detail URL.

**Layout.** A **fixed top section** — official **Artwork** with a front/back **Sprite**
toggle, name, number, Type badge(s), and the Favourite control — stays visible while three
**tap-switched tabs** change below it:
- **About** — description, category, height, weight, abilities
- **Stats** — the six base stats (HP, Attack, Defense, Sp. Atk, Sp. Def, Speed) as bars, + total
- **Evolution** — the Evolution line
The view opens on **About**. Horizontal swipe is reserved for Pokémon navigation, not tabs.

**Content**
- **AC-2.1** — Given I open a Pokémon, When About is shown, Then I see its Artwork, name,
  number, Type badge(s), description, category, height, weight, and abilities.
- **AC-2.2** — Given I switch to Stats, Then I see the six base stats as bars plus their total.
- **AC-2.3** — Given I switch to Evolution, Then I see the Evolution line with each stage's
  image and name, the current Pokémon highlighted.
- **AC-2.4** — Given the front/back toggle, When I toggle it, Then the front and back Sprite
  swap; if a back Sprite is missing, the toggle is hidden.

**Loading & errors (graceful, per-part)**
- **AC-2.5** — Given the view is loading, When data has not arrived, Then skeleton
  placeholders are shown (not a bare spinner).
- **AC-2.6** — Given the **core** Pokémon call fails, When I am shown an error, Then it is a
  whole-page error with retry.
- **AC-2.7** — Given only the **description** or **Evolution** call fails, When I view the
  page, Then the rest stays usable and just that tab shows an inline error with retry.

**Evolution behaviour**
- **AC-2.8** — Given the Evolution tab, When I tap another stage, Then that Pokémon's detail
  opens (a jump that **pushes** — Back returns to the Pokémon I jumped from).
- **AC-2.9** — Given a Pokémon that does not evolve, When I view Evolution, Then an empty
  state ("This Pokémon does not evolve") is shown.
- **AC-2.10** — Given a branching line (e.g. Eevee), When I view Evolution, Then all branches
  render and **wrap vertically** (never a horizontal scroll that would steal the swipe).

**Navigate between Pokémon** (only when opened from the main Browse feed)
- **AC-2.11** — Given I opened this Pokémon from the **main Browse feed**, When I swipe left/
  right (touch), tap the prev/next arrows (mouse), or press ←/→ (keyboard), Then I move to the
  previous/next entry in the global ordered list.
- **AC-2.12** — Given I move to an adjacent Pokémon, When it was prefetched, Then it appears
  instantly; otherwise a skeleton shows briefly. The app prefetches the ±1 neighbours.
- **AC-2.13** — Given I am at the first entry, Then previous is disabled; at the last entry,
  next is disabled (no wrap-around).
- **AC-2.13b** — Given the index ("phone book") has not finished loading yet (e.g. a cold
  deep-link), Then the prev/next arrows are disabled with a loading state until it is ready.
- **AC-2.14** — Given I swipe to a new Pokémon, When the view updates, Then the URL is
  **replaced** (so Back returns to the browse list, not through every Pokémon swiped past).
- **AC-2.15** — Given I opened this Pokémon from **Favourites, an active Type filter, or
  search results**, Then swipe and the prev/next arrows are **disabled** (I press Back to
  return to that set). *(Walking a subset is the context-aware-swipe stretch — §9 S8.)*

**Entry & Back**
- **AC-2.16** — Given each Pokémon has its own URL (e.g. `/pokemon/25`), When I open one
  directly (deep-link/refresh/share) with no in-app history, Then Back falls back to the
  Browse tab.
- **AC-2.17** — Given I swipe through Pokémon, When the Favourite control renders, Then it
  reflects the *current* Pokémon's saved state.
- **AC-2.18** — Given I open a Pokémon that does not exist (e.g. `/pokemon/99999` returns 404),
  When the page resolves, Then a **"not found" state** with a Go-to-Browse action is shown (no
  Retry, since a 404 cannot succeed on retry).

### UC-3 — View Pokémon images
**Actor:** Trainer.

- **AC-3.1** — Given any card, When it renders, Then its **Artwork** is shown, with alt text.
- **AC-3.2** — Given a detail view, When it renders, Then the official **Artwork** is shown,
  plus a front/back Sprite view.
- **AC-3.3** — Given an image fails to load, When rendering, Then a placeholder is shown in its
  place (no broken-image icon).

### UC-4 — Favourite Pokémon and view Favourites
**Actor:** Trainer · Favourites are marked **only from the detail view** and stored with Dex
number, name, and Type(s).

- **AC-4.1** — Given a detail view, When I tap Favourite, Then the Pokémon is saved (with its
  Type(s)) and the control shows the favourited state.
- **AC-4.2** — Given a favourited Pokémon's detail view, When I tap Unfavourite, Then it is
  removed from Favourites.
- **AC-4.3** — Given the Favourites tab, When it opens, Then my favourited Pokémon are listed
  as cards, rendered with no extra network requests for the list.
- **AC-4.4** — Given I have no Favourites, When I open the tab, Then an empty state is shown
  ("No favourites yet…").
- **AC-4.5** — Given Favourites exist, When I close and reopen the app on the same device,
  Then they are still there.
- **AC-4.6** — Given the Favourites tab, When I filter by a Type, Then only Favourites of that
  Type are shown (using the stored Type(s), no extra fetches).
- **AC-4.7** — Given I filter Favourites by a Type I have none of, When shown, Then an empty
  state ("No [Type] favourites") is displayed.
- **AC-4.8** — Given reading Favourites from storage fails, When I open the tab, Then an
  error + retry is shown (rather than a misleading empty state).

### UC-5 — Filter by Type
**Actor:** Trainer · **one Type at a time** ([ADR 0001](./adr/0001-hybrid-loaders-behind-one-source.md)).

- **AC-5.1** — Given the Browse tab, When I select a Type, Then the grid shows only Pokémon of
  that Type, still via infinite scroll.
- **AC-5.2** — Given a Type is active, When I select another Type, Then it replaces the first.
- **AC-5.3** — Given a Type is active, When I clear it, Then the full Dex-number-ordered browse
  returns.
- **AC-5.4** — Given a Type filter yields results, When shown, Then any active search is cleared
  (filter and search are alternative modes).
- **AC-5.5** — Given the `/type/{type}` fetch fails, When I am shown an error, Then it is an
  error + retry for the filtered grid; clearing the filter returns to the full browse.

### UC-6 — Search by name or number
**Actor:** Trainer · matches partial text against a cached name index; opens detail via
`/pokemon/{name|id}`.

- **AC-6.1** — Given the search box, When I type text, Then the same grid narrows to Pokémon
  whose name or Dex number matches (partial match).
- **AC-6.2** — Given a search with no matches, When shown, Then an empty state is displayed.
- **AC-6.3** — Given I clear the search, When empty, Then the full browse returns.
- **AC-6.4** — Given search results, When shown, Then any active Type filter is cleared.
- **AC-6.5** — Given the name index is still loading, When I focus the search box, Then it is
  briefly disabled with a hint, and enables once the index is ready.
- **AC-6.6** — Given the name-index fetch fails, When I try to search, Then a "search
  unavailable — retry" message is shown; the rest of browse stays usable.

## 6. Non-functional requirements

- **NFR-1 Smooth scroll:** browse must not stutter — no per-card network requests (cards use
  derivable image URLs only; card Artwork is lazy-loaded).
  - **Design note (rev 2 — see [DESIGN.md](./DESIGN.md) §2.3, [ADR 0006](./adr/0006-background-type-map-for-coloured-browse-cards.md)):** the reference-aligned UI
    **Type-colours browse cards**, which needs each card's Type — a conscious revisit of this
    rule and of **S5**. Kept smooth by resolving Types **off the scroll path**: cards render
    immediately (sprite + a neutral tint) and **colour in** as Types resolve from a
    **cached / batched background lookup** (reusing the `/type/{type}` sets already loaded for
    the filter where possible). No synchronous per-card fetch ever blocks scrolling.
- **NFR-2 Caching & prefetch:** the full name index ("phone book") is loaded **once at
  startup** via **count-then-fetch** (no hardcoded limit) and cached; details and Type sets are
  cached too, all behind a **single async cache interface**
  ([ADR 0003](./adr/0003-async-cache-seam.md)); repeat opens/filters do not refetch. When viewing a detail opened from the Browse feed, the
  **±1 neighbours are prefetched** (full bundle) so swipe feels instant; obsolete fetches from
  rapid swiping are cancelled/debounced. A failed request is **auto-retried ~2× with short
  backoff** (healing most blips and stray 429s) before surfacing the error state. Respects
  PokeAPI fair-use.
- **NFR-3 States:** every data view has **loading (skeletons)**, **empty**, and **error +
  retry** states — enumerated in the **State Matrix** (§6.1). Includes **offline detection**
  (platform online/offline signal → a clear "You're offline" state that **auto-recovers** when
  the connection returns) and a **"not found"** state for non-existent Pokémon (404).
- **NFR-4 Responsive:** mobile-first, scaling to tablet/desktop (grid gains columns at
  breakpoints). Pragmatic, not pixel-perfect.
- **NFR-5 Accessibility:** alt text on all images, keyboard-navigable, sensible labels.
- **NFR-6 Testing:** **unit + component** tests covering the loaders, cache, favourites,
  filter, and search, and the key screens. (E2E deferred — §9.)
- **NFR-7 Cross-platform:** one codebase runs as responsive web and installable iOS/Android
  ([ADR 0002](./adr/0002-ionic-capacitor.md)).

### 6.1 State Matrix

Makes NFR-3's "every view" checkable. Each cell is the required behaviour; "—" means not
applicable.

| View | Loading | Empty | Error + retry | Offline | Not-found |
|---|---|---|---|---|---|
| **Browse** | skeleton grid (first) · bottom spinner (more) | — (never empty) | full-view (first load) · inline (more) | offline state | — |
| **Detail** | skeletons | "does not evolve" (Evo tab) | whole-page (core) · per-tab (description/evolution) | offline state | 404 → "not found" + Go-to-Browse |
| **Favourites** | instant (local) | "No favourites yet" · "No [Type] favourites" | storage read failure | — (local data) | — |
| **Type filter** | skeleton grid | defensive only (types always have members) | `/type/{type}` fetch failure | offline state | — |
| **Search** | index loading → box disabled | "No matches" | index-load failure → "search unavailable" | offline state | — |

## 7. Information architecture

- **Browse tab** — infinite-scroll grid, Type filter control, search box.
- **Favourites tab** — Favourites grid with per-Type filtering + empty state.
- **Detail view** — pushed page from any card (or Evolution-stage tap, or a direct URL);
  fixed top section + About/Stats/Evolution tabs; hosts the Favourite control and the
  prev/next Pokémon navigation (enabled only from the Browse feed).
- Navigation: **bottom tab bar** (Browse, Favourites).

## 8. External dependency

PokeAPI (`https://pokeapi.co/api/v2`). Endpoints per §4. No API key required. We must cache
and avoid request floods per its fair-use policy.

## 9. Out of scope & stretch goals (prioritised)

| # | Item | Why deferred |
|---|---|---|
| S1 | Persistent offline cache (Ionic Storage / SQLite) | Additive on the async cache seam; biggest UX win if time allows |
| S2 | Search autocomplete dropdown | Matching already works via grid filter; dropdown is polish |
| S3 | Multi-type filtering (any-of / all-of) | Multiplies fetch/merge logic and muddies acceptance criteria |
| S4 | Combine search **with** Type filter | Alternative modes suffice for v1 |
| S5 | Type colour on browse cards — **adopted in rev 2** (reference design) | Was deferred for scroll-flood risk; now in, with Type resolved via cached/background lookup, not a synchronous per-card fetch (see NFR-1 note & [DESIGN.md](./DESIGN.md) §2.3) |
| S6 | Moves list on detail | Large, low payoff per effort |
| S7 | End-to-end tests | Added after the app is finished and polished |
| S8 | Context-aware swipe | Let detail swipe walk the *subset* you came from (next Favourite / next Water / next search hit) instead of being disabled outside the Browse feed |
| — | Accounts / cross-device sync | Requires a backend; breaks the frontend-only constraint |

## 10. Definition of done (v1)

- UC-1 … UC-6 pass all acceptance criteria on web and in a native build.
- NFR-1 … NFR-7 satisfied.
- Unit + component tests green; README explains how to run web + native.
- CONTEXT.md, ADRs, and this PRD current.
