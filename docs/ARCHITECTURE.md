# Pokédex — Architecture & Design

| | |
|---|---|
| **Status** | Draft for review |
| **Date** | 2026-09-27 |
| **Author** | jems.p14@gmail.com |

> The *what/why* lives in [`PRD.md`](./PRD.md); terminology in [`CONTEXT.md`](../CONTEXT.md);
> point decisions in [`docs/adr/`](./adr/). This doc is the technical *how*.

---

## Tech stack

| Concern | Choice | Why |
|---|---|---|
| UI / cross-platform | **Angular 22 + Ionic 9 + Capacitor 8** — one codebase → web + installable iOS/Android; standalone + zoneless | [ADR 0002](./adr/0002-ionic-capacitor.md) |
| State | **Angular signals** (RxJS for HTTP, search debounce, request cancellation) | [ADR 0005](./adr/0005-signals-over-ngrx.md) |
| Persistence | **Ionic Storage** (IndexedDB; optional native SQLite later) — backs the data cache *and* Favourites (separate stores) | [ADR 0003](./adr/0003-async-cache-seam.md) |
| Data source | **PokeAPI** (`/api/v2`) — no backend of our own | [PRD §8](./PRD.md) |
| Tests | **Vitest** (Angular's built-in default) — unit + component; E2E deferred | §9, [ADR 0009](./adr/0009-vitest-over-jest.md) |

*Angular 22 · Ionic 9 · Capacitor 8 · TypeScript 6.0 · Node 22 LTS; standalone components, zoneless.
Exact patch versions are pinned at scaffold time.*

## 1. Architectural style — three floors

The app is split into three layers; **calls only go downward**. This keeps each layer
testable in isolation and puts every external dependency behind a seam.

```
┌─────────────────────────────────────────────┐
│ PRESENTATION   pages + components (Ionic)     │  display & user actions only
├─────────────────────────────────────────────┤
│ APPLICATION    services holding state (signals)│  app logic: feed, index, detail, favourites, network
├─────────────────────────────────────────────┤
│ DATA           repository, API client, cache, │  talks to PokeAPI + device storage,
│                mappers, storage adapters       │  behind interfaces
└─────────────────────────────────────────────┘
```

Dependency rule: **presentation → application → data**. Presentation never imports the API
client or `HttpClient`; data never imports a component. Swapping a data-layer piece — the
cache's backing store (test fake ↔ Ionic Storage ↔ native SQLite), or the API client — leaves
the upper floors untouched ([ADR 0003](./adr/0003-async-cache-seam.md)).

### 1a. Project structure

The three floors map to folders under `src/app/` (dependency arrows point **down**; the last three
are cross-cutting, not layers). The `presentation → application → data` rule is **lint-enforced**
via `eslint-plugin-boundaries` (scaffold ticket), so a stray import fails CI rather than only review.

```
src/app/
  domain/        # shared vocabulary — models, AppError, PokemonTypeName (no framework deps)
  data/          # DATA floor
    api/         #   PokeApiClient — the only HttpClient / PokeAPI touch point
    dto/         #   raw PokeAPI response shapes
    mappers/     #   pure DTO → domain functions
    cache/       #   Cache seam + Ionic Storage impl (single-flight, versioned)
    stores/      #   FavouritesStore — separate store from the cache
    repository/  #   PokemonRepository — fetch-or-reuse boundary
  application/   # APPLICATION floor — signal services: index, feed, favourites, network, detail (+ sources/, matchesQuery)
  features/      # PRESENTATION floor — browse/ detail/ favourites/ page-not-found/ (pages + feature-local components)
  shared/ui/     # reusable primitives — PokemonCard, SpriteImage, TypeBadge, StatBar, Skeleton*, PokéBall, StateScreen
  core/          # app-wide singletons — interceptors (retry-backoff, error-normalise), DI tokens, boot splash dismissal
  theme/         # design tokens + the PokemonTypeName → colour map
```

`domain/` sits beneath every floor as the shared language (all layers may import it). `PokemonCard`
lives in `shared/ui/` — a dumb primitive reused by Browse and Favourites ([ADR 0007](./adr/0007-name-index-separate-from-type-map.md)),
not owned by a feature.

## 2. Domain models

Raw PokeAPI JSON is translated into these at the data boundary; nothing above the data layer
sees raw responses.

```ts
export type PokemonTypeName =
  | 'normal' | 'fire' | 'water' | 'grass' | 'electric' | 'ice' | 'fighting'
  | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug' | 'rock' | 'ghost'
  | 'dragon' | 'dark' | 'steel' | 'fairy';

export interface PokemonSummary {   // phone-book entry + browse/favourite card
  id: number;                       // PokeAPI entry id: 1..1025, or 10001+ for Forms
  name: string;                     // title-cased, de-hyphenated
  artworkUrl: string;               // official artwork, derived from id (no request); lazy-loaded on cards
}
// Type is deliberately NOT on the summary: PokemonCard takes `types` as an input and reads it
// live from the background map via typesOf(id) (ADR 0006, ADR 0007); undefined → neutral tint.

export interface StatSet {
  hp: number; attack: number; defense: number;
  specialAttack: number; specialDefense: number; speed: number;
  total: number;
}

export interface Pokemon {          // core /pokemon/{id}
  id: number;                       // PokeAPI entry id (10001+ for Forms)
  speciesId: number;                // = National Dex number; drives species/evolution fetch (ADR 0008)
  name: string;
  types: PokemonTypeName[];         // slot-ordered: types[0] is the primary Type
  heightM: number; weightKg: number;
  stats: StatSet; abilities: string[];
  artworkUrl: string; frontSpriteUrl: string; backSpriteUrl: string | null;
}

export interface Species {          // /pokemon-species/{speciesId}
  category: string;                 // genus, e.g. "Seed Pokémon"
  description: string;              // cleaned English flavour text
  evolutionChainId: number;         // parsed from the DTO's evolution_chain.url at the data boundary
}

export interface EvolutionNode {    // /evolution-chain/{chainId}, tree (branching)
  id: number; name: string; artworkUrl: string;   // artwork derived from id (no request)
  evolvesTo: EvolutionNode[];
}

export interface Favourite {        // stored on device
  id: number; name: string; types: PokemonTypeName[];
}
```

## 3. Key seams (interfaces)

Small interfaces hiding a lot of behaviour — the deep modules of the design.

```ts
// Async cache — Ionic Storage (IndexedDB) from v1, behind one seam (ADR 0003)
export interface Cache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  clear(): Promise<void>;                         // used on cache-version mismatch (§4a)
}

// One grid, many loaders — server-paged browse vs client-paged type/search (ADR 0001)
export interface PokemonPage { items: PokemonSummary[]; hasMore: boolean; }
export interface PokemonSource { loadNext(): Promise<PokemonPage>; reset(): void; }

// Favourites persistence — Ionic Storage (IndexedDB by default; optional native SQLite),
// a store separate from the data cache (ADR 0002)
export interface FavouritesStore {
  all(): Promise<Favourite[]>;
  add(f: Favourite): Promise<void>;
  remove(id: number): Promise<void>;
}
```

## 4. Data layer

- **`PokeApiClient`** — the only place that touches `HttpClient` / PokeAPI URLs.
- **Mappers** (`mappers/`) — pure functions: raw DTO → domain model. Unit-tested with tiny
  fixtures. Handle the messy bits: pick English flavour text and strip `\f\n`, title-case
  Form names, derive sprite/artwork URLs from id, sum the stat total, read `speciesId` from the
  `/pokemon` response's `species` ref, and parse `evolutionChainId` from the species DTO's
  `evolution_chain.url`.
- **`PokemonRepository`** — the fetch-or-reuse boundary. Every read goes through the `Cache`
  first; on miss it calls the client, maps to a domain model, stores it, returns it. It also
  **coalesces in-flight requests** (single-flight): concurrent misses for the same key share one
  request, so a thing is fetched from the network **at most once** (NFR-2).

```ts
@Injectable({ providedIn: 'root' })
export class PokemonRepository {
  getIndex(): Promise<PokemonSummary[]>;      // count-then-fetch, cached as "index" (ADR 0004)
  getPage(next: string | null): Promise<PokemonPage>;  // follows the list `next` link (live-paged, not cached)
  getByType(type: PokemonTypeName): Promise<PokemonSummary[]>;   // filter grid; from cached "type:{name}"
  getTypeIndex(): Promise<Map<number, PokemonTypeName[]>>;       // folds the 18 "type:{name}" sets → id→types[], primary-first via slot (ADR 0006)
  getPokemon(id: number): Promise<Pokemon>;              // by entry id, cached "pokemon:{id}"
  getSpecies(speciesId: number): Promise<Species>;       // by species id, cached "species:{speciesId}" (Form + base share)
  getEvolution(chainId: number): Promise<EvolutionNode>; // cached "evolution:{chainId}" (a family shares one)
}
```

Cache keys: `index`, `pokemon:{id}`, `species:{speciesId}`, `evolution:{chainId}`,
`type:{name}` (each type set stored with per-member `slot`). See §4a for the caching strategy.

### 4a. Caching strategy

**Persistent from v1.** The `Cache` is backed by **Ionic Storage** (IndexedDB on web/desktop
and native by default; an optional native SQLite driver is a later hardening step) so fetched
data **survives app reopen** — a warm start with no re-fetch of what's been seen
([ADR 0003](./adr/0003-async-cache-seam.md)). This is *not* offline: card/sprite images load
from the PokeAPI CDN and are **not** in this cache, so true offline (image caching) stays
stretch **S1**.

**Two tiers.**
- **(a) Persistent cache** — normalised, **one record per PokeAPI resource**, keyed as above.
  A Pokémon's detail is *not* one nested blob; e.g. Charizard is `pokemon:6` + `species:6` +
  `evolution:2`, stitched in memory by `DetailService` at runtime. Normalising lets a Form share
  its base's `species`/`evolution`, a family share one `evolution:{chainId}`, and the parts
  load/fail independently (per-tab errors, lazy evolution).
- **(b) In-memory session state** — rebuilt each launch: the ordered index + `positionOf`/
  `neighbours`/`search`, the folded colour map (`typesOf`), `FeedService` items, per-screen
  `DetailService` state. The colour map is **re-folded** from the persisted `type:{name}` sets
  (not itself persisted); the browse grid stays **live-paged** (ADR 0001), so a warm reopen
  re-fetches page 1 while details behind it are cache hits.

**Freshness.** PokeAPI reference data is **immutable**, so entries are **cached indefinitely —
no TTL, no invalidation**. The only mutable data, Favourites, lives in a **separate** store.

**Versioning.** A `cacheVersion` constant is stored with the data. On startup, if it mismatches
(or is absent), the **data cache is cleared** (`Cache.clear()`) and rebuilt cold; **Favourites
are never touched**. Bump it whenever a persisted record's shape changes between releases.

**Housekeeping.** No **negative caching** (a 404 re-hits; it flows through `notFound`, not the
cache). No **eviction** (the dex is bounded to a few MB). A failed cache **write** is swallowed
(the app still works from the network) — unlike a Favourites-store **read** failure, which is
shown (AC-4.8).

### HTTP interceptors

- **retry-backoff** — retries a failed request ~2× with short increasing delay (heals blips
  and stray 429s) before the error surfaces (NFR-2). **When the network is already known to be
  offline** (NetworkService), it **skips the retries** and surfaces `offline` immediately (fail
  fast), auto-recovering on reconnect (NFR-3).
- **error-normalise** — maps transport errors to a small `AppError` (`offline | notFound |
  transient`) so the UI branches cleanly (drives the 404 "not found" vs retry split).

`AppError` is the UI's **shared error vocabulary**, not only the interceptor's output:
`offline | notFound | transient | storage`. The interceptor produces the first three; the
Favourites/storage layer produces `storage` (AC-4.8). A favourite **write** failure is not a
distinct state — the heart reverts to its real value.

## 5. Application layer (services + signals)

State lives in signal-based services ([ADR 0005](./adr/0005-signals-over-ngrx.md)); components
read signals and re-render automatically. RxJS is used for HTTP, search-box debounce, and
cancelling obsolete requests.

- **`PokemonIndexService`** — loads the phone book once at **app startup** via the repository;
  exposes `ready` (signal), `positionOf(id)`, `neighbours(id)` (±1), and `search(text)`
  (partial name/number match over the index). After the index lands it **triggers the background
  Type warm-up** and *holds* the result: it calls `repository.getTypeIndex()` (which fetches the
  18 `/type` sets and **folds** them into the `id → Type(s)` map, primary-first via `slot`) and
  exposes `typesOf(id)` + a `typesReady` signal, so Browse cards colour in with **no per-card
  request** (NFR-1). Building the map lives in the repository (data-shaping); the service only
  *holds* it ([ADR 0006](./adr/0006-background-type-map-for-coloured-browse-cards.md)). The same
  `/type` sets warm the Type filter.
- **`FeedService`** — powers the Browse grid (UC-1/5/6). Holds the active mode
  (`browse | type | search`) and the current items + status as signals, delegating to the
  right `PokemonSource`. Switching mode calls `reset()` then `loadNext()`.
- **`FavouritesService`** — a `favourites` signal backed by `FavouritesStore`; `add/remove`,
  `isFavourite(id)`, `byType(type)` for the Favourites filter (types are stored, no fetch), and
  `search(text)` for the name/number search within the saved set (local only).
- **`NetworkService`** — an `online` signal from the platform (Capacitor Network / `navigator.onLine`)
  driving the offline state + auto-recover (NFR-3).
- **`DetailService`** — owns a **single detail screen**: it is **provided per `DetailPage`
  instance** (not root), so evolution-jump pushes keep their own state while the cache stays
  app-wide. It orchestrates the fetches (`getPokemon` → read `speciesId` → `getSpecies` → lazy
  `getEvolution(chainId)` on the Evolution tab), holds their **per-part** loading/error signals
  (whole-page for the core call, per-tab for description/evolution), resolves the **404**
  not-found state, keeps the Favourite control on the **current** Pokémon (AC-2.17), and — when
  swipe is enabled — **prefetches the ±1 neighbours** (Pokémon + species; evolution stays lazy),
  cancelling obsolete prefetches on rapid swipe. Delegates all fetching to the repository.

```ts
@Injectable({ providedIn: 'root' })
export class FeedService {
  private readonly _items = signal<PokemonSummary[]>([]);
  readonly items = this._items.asReadonly();
  readonly status = signal<'loading' | 'ready' | 'empty' | 'error'>('loading');
  loadNext(): Promise<void>;      // append next page from the active source
  setMode(mode: FeedMode): void;  // browse | { type } | { search }
}
```

## 6. Presentation layer

**Feature components**
- **Browse:** `BrowsePage` (hosts `ion-infinite-scroll`), `PokemonCard`, `TypeFilter`, `SearchBar`.
- **Detail:** `DetailPage` (fixed top + tabs), `DetailHeader` (artwork, front/back toggle,
  name, number, type badges, favourite), `AboutTab`, `StatsTab`, `EvolutionTab`, `PokemonNav`
  (prev/next arrows, ←/→ keys, swipe).
- **Favourites:** `FavouritesPage` — reuses `PokemonCard` + the grid.

**Shared UI** — `SpriteImage` (with placeholder fallback, AC-3.3), `TypeBadge`, `StatBar`,
`SkeletonCard` / `SkeletonDetail`, `EmptyState`, `ErrorState` (message + retry). These realise
the [State Matrix](./PRD.md#61-state-matrix) consistently across views.

> **`PokemonCard` is a dumb, reusable primitive**: it takes `types` as an **input** (it does no
> fetching, and there is no `PokemonSummary.types`). Browse & Type-filter grids bind
> `typesOf(id)` — reactive, so cards re-colour when the map fills; Favourites binds the stored
> `types` (AC-4.6). One card, three wiring sources
> ([ADR 0007](./adr/0007-name-index-separate-from-type-map.md)).

## 7. Routing

```ts
export const routes: Routes = [
  { path: 'tabs', children: [
    { path: 'browse', component: BrowsePage },
    { path: 'favourites', component: FavouritesPage },
    { path: '', redirectTo: 'browse', pathMatch: 'full' },
  ]},
  { path: 'pokemon/:id', component: DetailPage },   // deep-linkable
  { path: '', redirectTo: 'tabs/browse', pathMatch: 'full' },
];
```

- Card tap and evolution-stage jump **push** (Back returns to origin).
- Swipe **replaces** the URL (`replaceUrl: true`) so Back returns to the browse list (AC-2.14).
- Cold deep-link with no history → Back falls back to `tabs/browse` (AC-2.16).
- Swipe/arrows enabled only when the feed mode is `browse` (AC-2.11 / AC-2.15).
- **"Swipe-enabled" is carried in the router's navigation *state*, not the URL**, so shared/deep
  links stay clean (`/pokemon/25`). Browse origin passes "enabled"; Favourites / Type filter /
  search pass "disabled" (AC-2.15). When the flag is **absent** (refresh, cold deep-link, share)
  it **defaults to Browse context**: swipe enabled (loading until the index lands, AC-2.13b),
  Back → Browse (AC-2.16). The same flag gates neighbour prefetch (§8).
- **Android hardware back honours the same rules as the in-app Back.** It is a *separate input*
  from the header chevron, so it is wired once at the app shell rather than per page: it pops the
  router history, and on a cold deep-link with nothing to pop it goes to `tabs/browse` instead of
  exiting the app (the AC-2.16 fallback). From a tab root with nothing left to pop, it exits.
  Because swipe **replaces** the URL, a Trainer who swiped 25 → 30 is one back press from Browse,
  not six.
- **Navigate only via the Angular router** (never `window.location` / a hard `href` to an
  internal route) — a hard reload needlessly throws away the in-memory session state and cache.

## 8. Cross-cutting concerns

- **States** — the shared `Skeleton*/EmptyState/ErrorState` components + the `AppError` type
  cover every cell of the State Matrix; offline and not-found are first-class.
- **Startup / splash** — a brand boot cover, **not a data gate**: native via
  `@capacitor/splash-screen` (`launchShowDuration` + `SplashScreen.hide({ fadeOutDuration })`),
  web via an `index.html` overlay removed after Angular bootstrap. It holds a ~600ms minimum then
  fades into the Browse skeleton; it does **not** wait on `PokemonIndexService.ready` — search/swipe
  stay disabled until the index lands (AC-2.13b / AC-6.5). Visual spec:
  [DESIGN §6 SplashScreen](./DESIGN.md).
- **Prefetch** — on a Browse-origin detail (swipe enabled), `DetailService` uses
  `PokemonIndexService.neighbours(id)` for the ±1 ids and asks the repository to warm each
  neighbour's **Pokémon + species** (enough for the default About tab to appear instantly;
  **evolution stays lazy**, loaded only when its tab opens). `DetailService` cancels obsolete
  warm-ups on rapid swipe — but never a request a landed-on Pokémon is waiting on, and
  single-flight coalescing (§4) means a prefetch and a real navigation to the same id share one
  request.
- **Accessibility** — `SpriteImage` requires alt text; arrows are focusable with ←/→ bindings;
  Ionic components provide roles/labels.
- **Theming** — Ionic CSS variables; a `PokemonTypeName → colour` map for `TypeBadge`;
  light/dark via Ionic defaults.

## 9. Testing strategy (Vitest, per-layer)

| Layer | What we test | How |
|---|---|---|
| Mappers | DTO → domain correctness, flavour-text cleaning, Form naming | tiny JSON fixtures |
| Repository | fetch-or-reuse, cache keys, count-then-fetch, `next` paging, single-flight coalescing, cache versioning, `getTypeIndex` fold (primary-first) | fake `HttpClient` + in-memory `Cache` |
| Services | feed mode switching, index neighbours/search, favourites, offline, detail orchestration (fetch order, per-part errors, 404, prefetch) | mocked repository/stores |
| Components | rendering per state (loading/empty/error), user actions | mocked services, Ionic test utils |

Interceptors (retry-backoff, error-normalise) are unit-tested directly. E2E is deferred (§9 S7).

## 10. Build & run

- One Angular + Ionic codebase. **Web:** `ng build` / `ionic serve`. **Native:** Capacitor
  wraps the web build — `npx cap add ios|android`, `npx cap sync`, open in Xcode/Android Studio.
- No secrets/API keys (PokeAPI is open). Base URL in an environment file.
- **Persistence:** Ionic Storage (IndexedDB) on web/desktop and native in v1 — no extra setup;
  an optional native SQLite driver is a later hardening step (§4a, [ADR 0003](./adr/0003-async-cache-seam.md)).

## 11. Traceability (PRD → design)

| PRD | Realised by |
|---|---|
| UC-1 Browse | `FeedService` (browse mode) + `PokemonRepository.getPage` + `BrowsePage`/`PokemonCard` (Type-coloured via the background Type map, [ADR 0006](./adr/0006-background-type-map-for-coloured-browse-cards.md)) |
| UC-2 Detail + swipe | `DetailService` (per screen) + `DetailPage`+tabs, `PokemonNav`, `PokemonIndexService.neighbours`, prefetch |
| UC-3 Images | `SpriteImage`, derived URLs, mappers |
| UC-4 Favourites | `FavouritesService` + `FavouritesStore` (Ionic Storage) + `FavouritesPage` |
| UC-5 Type filter | `FeedService` (type mode) + `PokemonRepository.getByType` + `TypeFilter` |
| UC-6 Search | `PokemonIndexService.search` + `FeedService` (search mode) + `SearchBar` |
| NFR-2 cache/prefetch | persistent `Cache` seam (Ionic Storage) + `PokemonRepository` (single-flight) + `getTypeIndex` + index startup load + `DetailService` prefetch |
| NFR-3 states | shared state components + `AppError` + `NetworkService` |
