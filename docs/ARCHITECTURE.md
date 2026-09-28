# Pokédex — Architecture & Design

| | |
|---|---|
| **Status** | Draft for review |
| **Date** | 2026-09-27 |
| **Author** | jems.p14@gmail.com |

> The *what/why* lives in [`PRD.md`](./PRD.md); terminology in [`CONTEXT.md`](../CONTEXT.md);
> point decisions in [`docs/adr/`](./adr/). This doc is the technical *how*.

---

## 1. Architectural style — three floors

The app is split into three layers; **calls only go downward**. This keeps each layer
testable in isolation and puts every external dependency behind a seam.

```
┌─────────────────────────────────────────────┐
│ PRESENTATION   pages + components (Ionic)     │  display & user actions only
├─────────────────────────────────────────────┤
│ APPLICATION    services holding state (signals)│  app logic: feed, index, favourites, network
├─────────────────────────────────────────────┤
│ DATA           repository, API client, cache, │  talks to PokeAPI + device storage,
│                mappers, storage adapters       │  behind interfaces
└─────────────────────────────────────────────┘
```

Dependency rule: **presentation → application → data**. Presentation never imports the API
client or `HttpClient`; data never imports a component. Swapping a data-layer piece
(in-memory cache → disk) leaves the upper floors untouched ([ADR 0003](./adr/0003-async-cache-seam.md)).

## 2. Domain models

Raw PokeAPI JSON is translated into these at the data boundary; nothing above the data layer
sees raw responses.

```ts
export type PokemonTypeName =
  | 'normal' | 'fire' | 'water' | 'grass' | 'electric' | 'ice' | 'fighting'
  | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug' | 'rock' | 'ghost'
  | 'dragon' | 'dark' | 'steel' | 'fairy';

export interface PokemonSummary {   // phone-book entry + browse/favourite card
  id: number;                       // 1..1025, or 10001+ for Forms
  name: string;                     // title-cased, de-hyphenated
  imageUrl: string;                 // official artwork, derived from id (no request); lazy-loaded on cards
  types?: PokemonTypeName[];        // from the background Type map (ADR 0006); undefined until it lands → card shows a neutral tint
}

export interface StatSet {
  hp: number; attack: number; defense: number;
  specialAttack: number; specialDefense: number; speed: number;
  total: number;
}

export interface Pokemon {          // core /pokemon/{id}
  id: number; name: string;
  types: PokemonTypeName[];
  heightM: number; weightKg: number;
  stats: StatSet; abilities: string[];
  artworkUrl: string; frontSpriteUrl: string; backSpriteUrl: string | null;
}

export interface Species {          // /pokemon-species/{id}
  category: string;                 // genus, e.g. "Seed Pokémon"
  description: string;              // cleaned English flavour text
  evolutionChainUrl: string;
}

export interface EvolutionNode {    // /evolution-chain/{id}, tree (branching)
  id: number; name: string; spriteUrl: string;
  evolvesTo: EvolutionNode[];
}

export interface Favourite {        // stored on device
  id: number; name: string; types: PokemonTypeName[];
}
```

## 3. Key seams (interfaces)

Small interfaces hiding a lot of behaviour — the deep modules of the design.

```ts
// Async cache — in-memory now, Ionic Storage later, no caller change (ADR 0003)
export interface Cache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

// One grid, many loaders — server-paged browse vs client-paged type/search (ADR 0001)
export interface PokemonPage { items: PokemonSummary[]; hasMore: boolean; }
export interface PokemonSource { loadNext(): Promise<PokemonPage>; reset(): void; }

// Favourites persistence — localStorage/IndexedDB on web, SQLite on native (ADR 0002)
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
  Form names, derive sprite/artwork URLs from id, sum the stat total.
- **`PokemonRepository`** — the fetch-or-reuse boundary. Every read goes through the `Cache`
  first; on miss it calls the client, maps to a domain model, stores it, returns it.

```ts
@Injectable({ providedIn: 'root' })
export class PokemonRepository {
  getIndex(): Promise<PokemonSummary[]>;      // count-then-fetch, cached as "index" (ADR 0004)
  getPage(next: string | null): Promise<PokemonPage>;  // follows the list `next` link
  getByType(type: PokemonTypeName): Promise<PokemonSummary[]>;
  getPokemon(id: number): Promise<Pokemon>;   // cached "pokemon:{id}"
  getSpecies(id: number): Promise<Species>;   // cached "species:{id}"
  getEvolution(url: string): Promise<EvolutionNode>;
}
```

Cache keys: `index`, `pokemon:{id}`, `species:{id}`, `evolution:{id}`, `type:{name}`.

### HTTP interceptors

- **retry-backoff** — retries a failed request ~2× with short increasing delay (heals blips
  and stray 429s) before the error surfaces (NFR-2).
- **error-normalise** — maps transport errors to a small `AppError` (`offline | notFound |
  transient`) so the UI branches cleanly (drives the 404 "not found" vs retry split).

## 5. Application layer (services + signals)

State lives in signal-based services ([ADR 0005](./adr/0005-signals-over-ngrx.md)); components
read signals and re-render automatically. RxJS is used for HTTP, search-box debounce, and
cancelling obsolete requests.

- **`PokemonIndexService`** — loads the phone book once at **app startup** via the repository;
  exposes `ready` (signal), `positionOf(id)`, `neighbours(id)` (±1), and `search(text)`
  (partial name/number match over the index). After the index lands it **also loads the 18
  `/type` sets in the background** and folds them into an `id → Type(s)` map
  ([ADR 0006](./adr/0006-background-type-map-for-coloured-browse-cards.md)), exposing
  `typesOf(id)` + a `typesReady` signal so Browse cards colour in with **no per-card request**
  (NFR-1). The same `/type` sets warm the Type filter.
- **`FeedService`** — powers the Browse grid (UC-1/5/6). Holds the active mode
  (`browse | type | search`) and the current items + status as signals, delegating to the
  right `PokemonSource`. Switching mode calls `reset()` then `loadNext()`.
- **`FavouritesService`** — a `favourites` signal backed by `FavouritesStore`; `add/remove`,
  `isFavourite(id)`, and `byType(type)` for the Favourites filter (types are stored, no fetch).
- **`NetworkService`** — an `online` signal from the platform (Capacitor Network / `navigator.onLine`)
  driving the offline state + auto-recover (NFR-3).

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

## 8. Cross-cutting concerns

- **States** — the shared `Skeleton*/EmptyState/ErrorState` components + the `AppError` type
  cover every cell of the State Matrix; offline and not-found are first-class.
- **Startup / splash** — a brand boot cover, **not a data gate**: native via
  `@capacitor/splash-screen` (`launchShowDuration` + `SplashScreen.hide({ fadeOutDuration })`),
  web via an `index.html` overlay removed after Angular bootstrap. It holds a ~600ms minimum then
  fades into the Browse skeleton; it does **not** wait on `PokemonIndexService.ready` — search/swipe
  stay disabled until the index lands (AC-2.13b / AC-6.5). Visual spec:
  [DESIGN §6 SplashScreen](./DESIGN.md).
- **Prefetch** — on a Browse-origin detail, `PokemonIndexService.neighbours(id)` gives ±1, and
  the repository prefetches their full bundle; obsolete prefetches are cancelled on rapid swipe.
- **Accessibility** — `SpriteImage` requires alt text; arrows are focusable with ←/→ bindings;
  Ionic components provide roles/labels.
- **Theming** — Ionic CSS variables; a `PokemonTypeName → colour` map for `TypeBadge`;
  light/dark via Ionic defaults.

## 9. Testing strategy (Jest, per-layer)

| Layer | What we test | How |
|---|---|---|
| Mappers | DTO → domain correctness, flavour-text cleaning, Form naming | tiny JSON fixtures |
| Repository | fetch-or-reuse, cache keys, count-then-fetch, `next` paging | fake `HttpClient` + in-memory `Cache` |
| Services | feed mode switching, index neighbours/search, favourites, offline | mocked repository/stores |
| Components | rendering per state (loading/empty/error), user actions | mocked services, Ionic test utils |

Interceptors (retry-backoff, error-normalise) are unit-tested directly. E2E is deferred (§9 S7).

## 10. Build & run

- One Angular + Ionic codebase. **Web:** `ng build` / `ionic serve`. **Native:** Capacitor
  wraps the web build — `npx cap add ios|android`, `npx cap sync`, open in Xcode/Android Studio.
- No secrets/API keys (PokeAPI is open). Base URL in an environment file.

## 11. Traceability (PRD → design)

| PRD | Realised by |
|---|---|
| UC-1 Browse | `FeedService` (browse mode) + `PokemonRepository.getPage` + `BrowsePage`/`PokemonCard` (Type-coloured via the background Type map, [ADR 0006](./adr/0006-background-type-map-for-coloured-browse-cards.md)) |
| UC-2 Detail + swipe | `DetailPage`+tabs, `PokemonNav`, `PokemonIndexService.neighbours`, prefetch |
| UC-3 Images | `SpriteImage`, derived URLs, mappers |
| UC-4 Favourites | `FavouritesService` + `FavouritesStore` (Ionic Storage) + `FavouritesPage` |
| UC-5 Type filter | `FeedService` (type mode) + `PokemonRepository.getByType` + `TypeFilter` |
| UC-6 Search | `PokemonIndexService.search` + `FeedService` (search mode) + `SearchBar` |
| NFR-2 cache/prefetch | `Cache` seam + `PokemonRepository` + index startup load |
| NFR-3 states | shared state components + `AppError` + `NetworkService` |
