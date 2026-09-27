# 0001 — Hybrid loaders behind one Pokémon source

PokeAPI is asymmetric: the list endpoint (`/pokemon?offset&limit`) pages cleanly and
suits infinite scroll, but it cannot filter by Type; filtering must use `/type/{type}`,
which returns the *entire* set of that Type at once, unpaged. Search is similar — there
is no partial-match endpoint, so name matching is done against a cached name index.

We therefore feed the one infinite-scroll grid from **multiple loaders behind a single
`PokemonSource` interface**: a *server-paged* loader for unfiltered browse, and a
*client-paged* loader for a Type filter or a search (fetch the full set once, then reveal
it a page at a time on the client). The scroll UI is unaware of which loader is active.

## Considered options

- **Client-side index** — load all names/ids + a Type map at startup and treat scroll as
  virtual windowing. Cleanest composition, but the scroll is no longer network-paged,
  which understates the infinite-scroll requirement for a take-home reviewer.
- **Filter as a separate view** — a distinct results page per Type. Simplest, but makes
  filtering feel bolted on rather than part of the same browsing flow.

We chose the hybrid because it demonstrates *real* network-paged infinite scroll and
explicitly handles the API's asymmetry behind a clean seam.

## Consequences

- Two data-loading code paths to build and test, kept tidy behind `PokemonSource`.
- Type filter and search are *alternative* modes in v1 (one clears the other); combining
  them is a stretch goal.
