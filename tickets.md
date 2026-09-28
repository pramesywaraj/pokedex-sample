# Tickets: Pokédex build

Building the frontend-only Pokédex from the docs — [PRD](docs/PRD.md),
[ARCHITECTURE](docs/ARCHITECTURE.md), [DESIGN](docs/DESIGN.md), and ADRs 0001–0009. Each ticket is
a tracer-bullet vertical slice (schema → data → application → UI → tests), demoable on its own —
except ticket 4, a data foundation verified by unit tests. Tickets 2 and 4 are the design and data
**foundations** the feature slices build on.

Work the **frontier**: any ticket whose blockers are all checked off. Clear context between
tickets and drive each with `/implement`.

**Critical path:** 1 → 2 → 3 → 4 → 9 → 10 → 11 (→ 17). Once 4 lands, tickets 5/9/13 open in
parallel; once 5 lands, 6/7/8 open (12 also needs 9); 14/15 need only 3.

---

## 1 · Walking skeleton & toolchain

**What to build:** A running Ionic + Angular app a Trainer can open to the two-tab bar
(Browse · Favourites), with the toolchain and layering guardrails in place. No Pokémon data yet.

**Blocked by:** None — can start immediately.

- [ ] Scaffolded via `ionic start` (tabs template) on **Angular 22 · Ionic 9 · Capacitor 8**, standalone components, zoneless
- [ ] Test runner is **Vitest** (Karma removed); a sample unit test passes via the test command
- [ ] ESLint (angular-eslint) + Prettier + **eslint-plugin-boundaries** configured so the presentation→application→data layering is lint-enforced (ARCHITECTURE §1)
- [ ] Folder skeleton created per [ARCHITECTURE §1a](docs/ARCHITECTURE.md#1a-project-structure): `domain/ data/ application/ features/ shared/ui/ core/ theme/`
- [ ] Capacitor initialised with the web build target; **build · serve · test · lint** all green
- [ ] CLAUDE.md "Commands / structure" gets the real commands (the folder layout is already recorded in ARCHITECTURE §1a)

## 2 · Design tokens & theme foundation

**What to build:** The design-system layer every screen consumes — a thin token layer over
Ionic's CSS variables ([DESIGN §1](docs/DESIGN.md)) — plus the branded app chrome. No Pokémon data.

**Blocked by:** 1

- [ ] Brand + neutral tokens (DESIGN §2.1) mapped onto Ionic's CSS variables (`--ion-color-*`) and custom properties: `accent #DC0A2D`, `ink`, `muted`, `subtle`, `bg`, `surface`, `border`, `stat`, `disabled`
- [ ] The 18 **Type colours** (DESIGN §2.2) as CSS variables **and** a `PokemonTypeName → colour` TS map with the per-type label (black/white) contrast, for runtime lookup by cards/badges/chips/headers (ARCHITECTURE §8)
- [ ] Spacing (4-based scale), radius, elevation (incl. the Type-tinted shadow recipe) and motion durations/easing (DESIGN §4) as tokens
- [ ] Typography roles on the system font stack (DESIGN §3); light **and** dark both wired via Ionic defaults and verified at build (DESIGN §1)
- [ ] App chrome themed: red "Pokédex" title + full-width bottom tab bar with the red accent + active/inactive states (DESIGN §6 App chrome)
- [ ] Tokens live in `theme/` (values + the Type-colour map) alongside Ionic's `variables.scss`; a unit test asserts the `PokemonTypeName → colour` map resolves all 18 types with a valid label

## 3 · Browse the dex — infinite scroll

**What to build:** A Trainer opens the app and scrolls the whole dex in a responsive grid; each
card shows official artwork, the title-cased name, and the zero-padded number, loading page by
page as they scroll.

**Blocked by:** 1, 2

- [ ] Browse shows the first page on load and appends the next page on infinite scroll — network-paged, following the list `next` link, not the index (ADR 0001; UC-1)
- [ ] A skeleton grid shows on first load (AC-1.1); a bottom spinner shows while loading more
- [ ] First-load failure shows an error state with Retry; card artwork falls back to a placeholder on image error (AC-3.3)
- [ ] Cards are neutral-tinted for now (Type colour arrives in ticket 10); grid is 2→4 columns, content capped at 768 (NFR-4)
- [ ] `PokemonCard` is a dumb primitive taking `types` as an **input** — it does no fetching, and there is no `PokemonSummary.types` (ADR 0007)
- [ ] Brings in: `PokemonSummary`/`PokemonTypeName`/`AppError` domain types, `PokeApiClient.getPage` + list mapper, the `PokemonSource` seam, `FeedService` (browse mode), `SpriteImage`, and a minimal error-normalise interceptor

## 4 · Persistent cache + repository foundation

**What to build:** The fetch-or-reuse data core the whole detail side builds on — a persistent
cache and a repository that fetches each PokeAPI resource at most once. No new screen; verified by
unit tests.

**Blocked by:** 3

- [ ] `Cache` seam backed by Ionic Storage (IndexedDB); cached reads survive app reopen; `clear()` on a `cacheVersion` mismatch, with Favourites never touched (ADR 0003; §4a)
- [ ] `PokemonRepository` reads through the cache first, then fetches → maps → stores on a miss, for `getPokemon` (entry id) and `getSpecies` (species id) — one record per resource, keyed `pokemon:{id}` / `species:{speciesId}`
- [ ] Concurrent misses for the same key share **one** in-flight request (single-flight coalescing — NFR-2)
- [ ] Mappers cover: pick + clean the English flavour text, title-case Form names, derive artwork/sprite URLs from id, sum the stat total, read `speciesId` from the species ref, and parse `evolutionChainId` from the species DTO (ADR 0008)
- [ ] Unit tests cover fetch-or-reuse, cache keys, single-flight coalescing, version-clear, and each mapper

## 5 · Detail — About tab

**What to build:** A Trainer taps a card and is pushed to a Type-coloured detail with an About
tab; a bad id shows the not-found "mystery Pokémon".

**Blocked by:** 4

- [ ] Tapping a card **pushes** `pokemon/:id` (Angular router only — never a hard href); Back returns to Browse (AC-2.16 fallback when there's no history)
- [ ] Detail header shows the full primary-Type-colour panel, name, number, genus, Type pills, and the front/back **sprite flip** (hidden when there's no back sprite — AC-2.4)
- [ ] About tab shows the cleaned description, height/weight, and abilities (no Moves/Breeding/Type-defences — §9 scope)
- [ ] `SkeletonDetail` while loading (AC-2.5); whole-page error + Retry on the core fetch; per-tab error on the description
- [ ] An id that 404s shows the mystery-Pokémon not-found state (`???` / `#—` / Unknown) + Go-to-Browse, no Retry (AC-2.18); 404 flows through `notFound`, never the cache
- [ ] Brings in: per-screen `DetailService` (provided on `DetailPage`, not root), orchestrating `getPokemon` → read `speciesId` → `getSpecies`; the `TypeBadge` primitive (consuming the ticket-2 Type-colour map)

## 6 · Detail — Base Stats tab

**What to build:** The Base Stats tab shows the six stats plus a total, animating in when opened.

**Blocked by:** 5

- [ ] Six `StatBar`s (HP, Attack, Defense, Sp. Atk, Sp. Def, Speed) with Type-colour labels + single red-coral fills, plus a **Total** row (AC-2.2)
- [ ] Bars grow-in when the tab opens; values come from the already-fetched Pokémon (no extra request)

## 7 · Detail — Evolution tab (lazy) + stage jump

**What to build:** The Evolution tab lazily loads the family and lets a Trainer jump between
stages.

**Blocked by:** 5

- [ ] Evolution loads only when its tab first opens (`getEvolution(chainId)`, cached per family); per-tab error + Retry
- [ ] Laid out one step per row — *from* → arrow carrying the evolution method (e.g. *Lv. 16*) → *to* — so branches wrap and never steal the swipe (AC-2.10); the current Pokémon gets an accent ring
- [ ] Tapping a stage **pushes** that Pokémon's Detail; Back returns to the stage jumped from (AC-2.8)
- [ ] A non-evolver shows "This Pokémon does not evolve" (AC-2.9)

## 8 · Favourites — save & view

**What to build:** A Trainer favourites a Pokémon from its detail and sees it on the Favourites
tab.

**Blocked by:** 3, 5

- [ ] The detail ♥ toggles the current Pokémon (AC-2.17); the write is optimistic and reverts the heart on a store write failure
- [ ] The Favourite is stored on device with its `types[]` in a store **separate** from the data cache, never version-cleared (ADR 0003)
- [ ] Favourites tab reuses `PokemonCard`, binding the **stored** types (no fetch — AC-4.6)
- [ ] Empty state "No favourites yet" (Poké Ball icon + Go-to-Browse); a storage **read** failure is shown with Retry (AC-4.8)

## 9 · Search the dex — startup index

**What to build:** A Trainer searches the dex by name or number from a search bar that fills the
Browse feed with matches.

**Blocked by:** 4

- [ ] The index ("phone book") loads once at startup via the repository (count-then-fetch, cached as `index` — ADR 0004), exposing `ready`, `positionOf`, and `neighbours(±1)`
- [ ] `search(text)` does a partial name/number match over the index; feeds the Browse grid in search mode; "No matches" empty state
- [ ] The search bar is **disabled with a hint** while the index loads (AC-6.5) and shows "search unavailable — retry" if the index fetch fails (AC-6.6)
- [ ] Typing clears any active Type chip (alternative modes — AC-6.4)

## 10 · Type-coloured Browse cards

**What to build:** Browse cards fill in with their Type colour shortly after the grid appears —
with no per-card request.

**Blocked by:** 9

- [ ] After the index lands, a background Type warm-up folds the 18 `/type` sets into an `id → Type(s)` map, primary-first via `slot` (`getTypeIndex`; ADR 0006/0007)
- [ ] `PokemonIndexService` holds the map and exposes `typesOf(id)` + a `typesReady` signal; the 18 sets are cached `type:{name}` for reuse (ticket 11)
- [ ] Cards bind `typesOf(id)` reactively and re-colour (solid primary-Type fill + Type-tinted shadow, from the ticket-2 tokens) when the map fills; undefined → neutral tint (NFR-1)

## 11 · Filter Browse by Type

**What to build:** A Trainer taps a Type chip to filter the Browse feed to that Type.

**Blocked by:** 10

- [ ] A horizontally-scrolling `TypeFilter` chip row (leading neutral "All" + solid Type chips); the feed switches to type mode (`getByType`, reusing the cached `type:{name}` set)
- [ ] Selecting a Type clears any active search and vice-versa (AC-5.1, AC-5.4); a cold Type filter shows a brief skeleton, then the grid; fetch error + Retry
- [ ] Detail opened from a Type filter has nav **disabled** (AC-2.15)

## 12 · Detail navigation — swipe / arrows / prefetch

**What to build:** From a Browse-origin detail, a Trainer swipes or arrows between adjacent
Pokémon, and the neighbours are already warm.

**Blocked by:** 5, 9

- [ ] `PokemonNav` supports swipe, flanking ‹ / › chevrons, and ←/→ keys; navigating **replaces** the URL so Back returns to Browse (AC-2.11–2.14)
- [ ] Enabled only from the main Browse feed (nav flag carried in router navigation **state**, not the URL); dimmed/disabled from Favourites, Type filter, or search; loading until the index is ready (AC-2.13b, AC-2.15)
- [ ] `DetailService` prefetches the ±1 neighbours' Pokémon + species (evolution stays lazy) and cancels obsolete prefetches on rapid swipe, never cancelling one the landed-on Pokémon needs (NFR-2)

## 13 · Offline & resilience

**What to build:** Transient failures heal quietly, and going offline shows a first-class offline
state that recovers on reconnect.

**Blocked by:** 3, 4

- [ ] retry-backoff interceptor retries ~2× with short increasing delay; when already known offline it **skips** retries and surfaces `offline` immediately (NFR-2)
- [ ] `NetworkService` exposes an `online` signal (Capacitor Network / `navigator.onLine`); data views show the offline state and auto-recover on reconnect (NFR-3)
- [ ] error-normalise maps transport errors to `AppError` (`offline | notFound | transient`), driving the 404-vs-retry split

## 14 · Splash boot cover

**What to build:** A brand boot cover appears at launch and hands straight off to the Browse
skeleton.

**Blocked by:** 3

- [ ] Native via `@capacitor/splash-screen` (`launchShowDuration` + `hide({ fadeOutDuration })`); web via an `index.html` overlay removed after Angular bootstrap
- [ ] Full-bleed red field, Poké Ball watermarks, hero ball + "Pokédex" + "Warming up the Pokédex…"; identical light/dark; static (no motion)
- [ ] ~600ms minimum floor, then a ~200ms fade into the Browse skeleton; gates on **nothing** (does not wait on the index — AC-2.13b / AC-6.5); no error/offline/timeout state

## 15 · App-level 404 page

**What to build:** An unknown route shows a friendly "Page not found" page (distinct from the
Pokémon not-found detail state).

**Blocked by:** 3

- [ ] The router wildcard route renders the "Page not found" state: `4` · Poké Ball · `4`, playful copy, and a Back-to-Browse button
- [ ] Built mobile / tablet / desktop, centred on resize

## 16 · Responsive Detail — two-pane (≥768)

**What to build:** On tablet and desktop the detail becomes a two-pane split, and a centred card
on desktop.

**Blocked by:** 5, 6, 7

- [ ] At ≥768 the detail is a two-pane split — Type-colour hero (larger artwork, extra Poké Ball highlights) on the left, tabs + active tab body on the right, content directly on the white panel (no inner card)
- [ ] At desktop the two-pane sits as a centred floating card on a neutral canvas; dark mode inherits Ionic defaults, verified at build (DESIGN §5)

## 17 · Favourites — filter by Type + search within

**What to build:** A Trainer narrows their saved set by Type or by a search over just the
favourites.

**Blocked by:** 8, 9, 11

- [ ] The Favourites tab reuses `TypeFilter` (`byType`, from stored types — no fetch) and `SearchBar` (search within the saved set); both hidden on the empty state (AC-4.6, AC-4.9)
- [ ] A "No [Type] favourites" empty state when a filter matches nothing
