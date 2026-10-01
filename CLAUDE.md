# Pokédex — Claude Code guide

Frontend-only Pokédex (take-home assessment). This file is the short **"read these first, and
don't break these"** note — it *points*, it doesn't repeat.

## Read these first (source of truth)

- [`docs/PRD.md`](docs/PRD.md) — what/why: use cases, acceptance criteria, the State Matrix
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — the technical *how*: tech stack, layers, domain models, caching strategy
- [`CONTEXT.md`](CONTEXT.md) — glossary / ubiquitous language (**use these exact words**)
- [`docs/adr/`](docs/adr/) — point decisions with rationale (ADR 0001–0009)
- [`docs/DESIGN.md`](docs/DESIGN.md) — visual & interaction design

## Tech stack

Angular + Ionic + Capacitor · state via **Angular signals** (RxJS for HTTP/debounce/cancellation) ·
persistence via **Ionic Storage (IndexedDB)** · tests in **Vitest**. See
[ARCHITECTURE → Tech stack](docs/ARCHITECTURE.md#tech-stack) for the list and ADR 0002/0003/0005/0009
for the why. *(Angular 22 · Ionic 9 · Capacitor 8 · Node 22 LTS; standalone + zoneless; exact patch
versions pinned at scaffold.)*

## Invariants — don't break these

- **Layering:** presentation → application → data. Presentation never imports `HttpClient` / the
  API client; data never imports a component.
- **Two ids:** a Pokémon's *entry id* (`/pokemon/{id}`, 10001+ for Forms) is **not** its *species
  id* (= Dex number). **Never `getSpecies(entryId)`** — species/evolution are keyed by
  species / chain id, or every Form 404s ([ADR 0008](docs/adr/0008-entry-id-vs-species-id.md)).
- **Navigate only via the Angular router** — never `window.location` / a hard `href` to an
  internal route (a hard reload wipes the in-memory session state *and* the cache).
- **`PokemonCard` takes `types` as an input** — it does no fetching, and there is no
  `PokemonSummary.types`. Browse/filter bind `typesOf(id)` (reactive); Favourites bind stored
  `types`.
- **Cache is persistent + single-flight + versioned** ([ADR 0003](docs/adr/0003-async-cache-seam.md)) —
  don't "simplify" the async seam, the request coalescing, or the version key away. It holds
  immutable reference data (no TTL); a failed cache *write* is swallowed; **Favourites are a
  separate store and are never version-cleared**.
- **`DetailService` is per-screen** (provided on `DetailPage`), not root — so stacked
  evolution-jumps keep their own state.
- **Browse stays network-paged** ([ADR 0001](docs/adr/0001-hybrid-loaders-behind-one-source.md)/
  [0006](docs/adr/0006-background-type-map-for-coloured-browse-cards.md)); the Type map / index
  is not the paging source.

## Commands / structure

- **Folder layout** — the three floors map to `src/app/{domain,data,application,features,shared/ui,
  core,theme}`; see [ARCHITECTURE → Project structure](docs/ARCHITECTURE.md#1a-project-structure).
  Layering is lint-enforced (`eslint-plugin-boundaries`).
- **Node** — 22 (`.nvmrc` pins 22.23.3; Angular 22 requires `^22.22.3`). Run `nvm use` first.
- **Commands**

  | Command | What it does |
  |---|---|
  | `npm start` | dev server on :4200 (`ng serve`) |
  | `npm run build` | production build → `dist/pokedex/browser` |
  | `npm test` | unit tests once, Vitest (`npm run test:watch` to watch) |
  | `npm run lint` | ESLint — includes the layering check |
  | `npm run format` | Prettier write (`format:check` to verify) |
  | `npm run sync:android` | production build, then `npx cap sync android` |
  | `npm run run:android` | that, then launch on a connected device |

  Capacitor wraps the same web build — `android/` is added and committed; iOS is not added yet.
  The Android build needs JDK 21 and the Android SDK (compileSdk 36, minSdk 24); the pins and the
  reasoning are in [ARCHITECTURE → Build & run](docs/ARCHITECTURE.md#10-build--run), the run steps
  in the [README](README.md#run-on-android).

  *On macOS, `ng serve` can die with `EMFILE` because `kern.maxfilesperproc` (10240) is below what
  the file watcher wants. Use `npm start -- --poll 3000` if you hit it.*

## House rules — how we write code

A few working agreements so the codebase stays easy to read and everything feels like it was
written by one person. These are about *craft*; the hard architectural lines live under
[Invariants](#invariants--dont-break-these) above — don't cross those.

### Lean on modern Angular (22)

We're standalone + zoneless, so write with that grain, not against it:

- **Signals first for state.** Hold state in `signal()`, derive with `computed()`, and reach for
  `effect()` only for real side-effects — never just to copy one signal into another. Keep the
  writable signal private and expose a read-only view (`.asReadonly()`).
- **Use the new template control flow** — `@if`, `@for`, `@switch`. Don't reach for the old
  `*ngIf` / `*ngFor` / `*ngSwitch`. Every `@for` needs a `track`.
- **Inputs and outputs are functions** — `input()`, `output()`, `model()` — not the `@Input()` /
  `@Output()` decorators.
- **Get dependencies with `inject()`** instead of constructor parameters — it reads cleaner and
  works the same in functions, guards, and interceptors.
- **Keep templates dumb.** No heavy expressions or method calls that re-run every render; push
  that logic into a `computed()` or a clearly named method.
- **Clean up after yourself.** Prefer signals / the `async` pipe over manual `.subscribe()`. When
  you must subscribe, tear it down with `takeUntilDestroyed()`.
- **Lazy-load feature routes**, and use `@defer` for anything heavy that isn't needed on first
  paint.
- **No `any`.** We already have real domain models — use them (or `unknown` and narrow).

### Names should say what they are

- A name should tell you its job before you open the file. `neighbours(id)`, `loadNext()`,
  `isFavourite` — not `data`, `handle()`, `flag`.
- Functions are verbs (`getSpecies`, `foldTypeIndex`); values and signals are nouns (`favourites`,
  `typesReady`); booleans read like a yes/no question (`hasMore`, `isOffline`).
- Use the **exact words from [`CONTEXT.md`](CONTEXT.md)** — *entry id*, *species id*, *summary*,
  *feed*. Same idea → same word, everywhere. If you rename a concept, rename it everywhere.

### Reuse before you rebuild

- Before hand-building any UI, check [`shared/ui/`](docs/ARCHITECTURE.md#1a-project-structure) and
  the feature folder — the piece you need (a card, a badge, a state screen) probably already
  exists. Don't redraw a primitive we already have.
- If two places need the same thing, lift it into `shared/ui/` as a **dumb primitive**: data in via
  `input()`, events out via `output()`, no fetching and no service calls. `PokemonCard` is the
  model to copy.
- But don't generalise on a hunch — see YAGNI below. Pull something into `shared/ui/` when there's
  a *real* second use, not an imagined one.

### Write a line about what each function is for

Every function and method gets a short doc comment, so a teammate can read its purpose on hover
without jumping into the file. Say **what it's for and why it exists** — not a re-narration of the
code. This matters most for the shared UI, utilities, mappers, and the service/repository seams
other people call. Use JSDoc:

```ts
/**
 * Returns the entry ids just before and after the given one in Dex order, so
 * Detail can offer prev/next swipe. At the ends of the list the missing side
 * comes back undefined.
 */
neighbours(id: number): { prev?: number; next?: number } { … }
```

Keep it to a sentence or two. If a function needs a whole paragraph to explain, that's usually a
hint it's doing too much and wants splitting.

### Build the UI from the design, not from memory

- Match the **Figma mockup** and [`docs/DESIGN.md`](docs/DESIGN.md) — spacing, sizes, states, copy.
  When in doubt, open the design and check; don't eyeball an approximation.
- Pull colours, spacing, and type from the **theme tokens** (Ionic CSS variables + the
  `PokemonTypeName → colour` map). No hard-coded hex or magic pixel values sprinkled through
  components.
- Cover **every state** a screen can be in — loading, empty, error, offline, not-found — with the
  shared state components. The [State Matrix](docs/PRD.md#61-state-matrix) is the checklist.

### Put new files where they belong

- New files land on the right floor per [the structure map](docs/ARCHITECTURE.md#1a-project-structure)
  and respect the layering rule (it's lint-enforced, so a stray import fails CI). Feature-only
  pieces stay inside their feature; anything shared goes to `shared/ui/`.
- Match the naming and shape of the files already there — one component / service / concept per
  file. When unsure, copy the pattern of the nearest neighbour.

### Build only what the ticket needs (YAGNI)

- Write the simplest thing that satisfies the PRD / ticket in front of you. Skip the speculative
  `options` object, the extra config flag, the abstraction for a "second case" that doesn't exist
  yet.
- Fewer moving parts is the goal — you can always add the seam when the second *real* need shows
  up. (This is the flip side of "reuse before you rebuild": generalise on evidence, not on a hunch.)

### A few more that keep us sane

- **One job per function.** Small and focused beats clever and long.
- **Comments explain *why*** — the tricky bit or the non-obvious decision. The code already shows
  the *what*.
- **Tests ride along with the code** (Vitest, per layer — see
  [ARCHITECTURE §9](docs/ARCHITECTURE.md#9-testing-strategy-vitest-per-layer)). A bug fix comes with
  the test that would have caught it.
- **Don't mutate a signal's value in place** — set a new value / array so change detection sees it.
- **Run lint before you push.** Consistency wins over personal taste; if you and the linter
  disagree, the linter is usually encoding a team decision.
- **Accessibility isn't optional** — alt text on images, keyboard reach on interactive bits, labels
  on controls.

### Quick Do / Don't

A fast gut-check. Each row maps back to a rule above.

| ✅ Do | 🚫 Don't |
|---|---|
| `@if` / `@for (… ; track id)` in templates | old `*ngIf` / `*ngFor` / `*ngSwitch`, or a `@for` with no `track` |
| `input()` · `output()` · `model()` · `inject()` | `@Input()` / `@Output()` decorators or constructor injection |
| derive with `computed()` | use `effect()` just to copy one signal into another |
| expose signals as `.asReadonly()` | hand out the writable signal |
| set a new value/array on a signal | mutate a signal's value in place |
| `takeUntilDestroyed()` or the `async` pipe | leave a manual `.subscribe()` uncleaned |
| real domain models, or `unknown` + narrow | `any` |
| names that state intent (`isFavourite`, `loadNext()`) | vague names (`flag`, `data`, `handle()`) |
| a one-line JSDoc on every function | ship an undocumented shared util / mapper / seam |
| reuse the `shared/ui/` primitive | redraw a card / badge / state screen that already exists |
| build exactly what the ticket needs | add speculative flags, options, or "just in case" abstractions |
| pull from theme tokens (Ionic vars, type-colour map) | hard-code hex colours or magic pixel values |
| place files per the structure map, layering downward | import upward (presentation reaching into data) |
| navigate via the Angular router | `window.location` / a hard `href` to an internal route |
| key species / evolution by *species id* | `getSpecies(entryId)` — every Form 404s ([ADR 0008](docs/adr/0008-entry-id-vs-species-id.md)) |
| cover every State-Matrix cell with shared state components | leave loading / empty / error / offline / not-found unhandled |
