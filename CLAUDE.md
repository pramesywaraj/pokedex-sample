# Pokédex — Claude Code guide

Frontend-only Pokédex (take-home assessment). This file is the short **"read these first, and
don't break these"** note — it *points*, it doesn't repeat.

## Read these first (source of truth)

- [`docs/PRD.md`](docs/PRD.md) — what/why: use cases, acceptance criteria, the State Matrix
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — the technical *how*: tech stack, layers, domain models, caching strategy
- [`CONTEXT.md`](CONTEXT.md) — glossary / ubiquitous language (**use these exact words**)
- [`docs/adr/`](docs/adr/) — point decisions with rationale (ADR 0001–0008)
- [`docs/DESIGN.md`](docs/DESIGN.md) — visual & interaction design

## Tech stack

Angular + Ionic + Capacitor · state via **Angular signals** (RxJS for HTTP/debounce/cancellation) ·
persistence via **Ionic Storage (IndexedDB)** · tests in **Jest**. See
[ARCHITECTURE → Tech stack](docs/ARCHITECTURE.md#tech-stack) for the list and ADR 0002/0003/0005
for the why. *(Exact versions pinned at scaffold.)*

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

_TBD — filled in right after scaffolding (build · serve · test · lint; folder layout)._
