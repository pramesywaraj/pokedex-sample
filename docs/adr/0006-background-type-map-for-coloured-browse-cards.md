# 0006 — Background Type map for Type-coloured browse cards

The reference-aligned UI ([DESIGN.md](../DESIGN.md) rev 2) **colours each Browse card by its
Type**. But a card is built from `PokemonSummary` `{id, name, spriteUrl}`, and the startup
index (the "phone book", `GET /pokemon?limit={count}`) returns only `{name, url}` — **neither
carries a Type**. And **NFR-1** forbids per-card network requests so the scroll never stutters.

Detail and Favourites are unaffected: Detail already fetches `GET /pokemon/{id}` (which returns
the Type), and a `Favourite` is stored on-device with its `types[]` (AC-4.6). **Only the Browse
grid lacks Type.**

We resolve it with a **Type map loaded off the scroll path**: after the startup index lands, a
background pass loads the `/type/{type}` sets (the same endpoint the Type filter uses,
ADR [0001](./0001-hybrid-loaders-behind-one-source.md)) and folds them into an in-memory
`id → PokemonTypeName[]` map. Cards render **immediately** (sprite + neutral tint) and **colour
in** once the map is ready. There is **no per-card request** and no synchronous work on the
scroll path.

**How many calls:** PokeAPI lists **21 types, but 3 are empty** (`stellar`, `unknown`,
`shadow`), so the pass makes **18** real calls. Together they cover **all 1351 entries, Forms
included** (verified: the union of the sets equals the phone-book count), so every card can be
coloured.

**Timing:** the warm-up fires **right after** the startup index and the first Browse page — not
bundled in with them — so it doesn't compete with the cards and search for the browser's ~6
concurrent download slots. And it is only ever an **optimisation**: the Type filter has its
**own on-demand fetch** ([ADR 0007](./0007-name-index-separate-from-type-map.md)), so if a user
filters before the warm-up reaches that Type, the filter fetches it itself (brief skeleton, then
results) and caches it. Nothing ever *depends* on the warm-up having finished.

This is deliberately *only* a colour-metadata layer. **Browse paging still follows the list
`next` links** — the real network-paged scroll that ADR 0001 chose is untouched; the map does
not become the paging source (ADR 0001 explicitly rejected a client-side index *for paging*).

## Considered options

- **Lazy per-card lookup (batched + cached).** Cards fetch/derive their Type as they scroll
  into view. Colours in too, but puts a worker on the scroll path and risks the exact stutter
  NFR-1 guards against — rejected.
- **Neutral browse cards.** Drop the colour, no machinery at all. Rejected only because we
  chose to match the reference; it remains the trivial fallback if the map ever misbehaves.
- **Enrich the index.** `GET /pokemon?limit={count}` has no Type field, so the phone book
  cannot supply it — not possible without the `/type` sets anyway.

## Consequences

- ~18 extra requests at startup, **in the background** and **cached** via the async cache seam
  (ADR [0003](./0003-async-cache-seam.md)). Much of this is **shared** with the Type filter,
  which loads the same `/type` sets on demand — a warmed map means instant filtering too.
- `PokemonSummary` gains an optional **`types?: PokemonTypeName[]`**, populated from the map;
  `undefined` until it lands, which the card renders as a **neutral placeholder tint**.
- `PokemonIndexService` owns the map alongside the phone book: `typesOf(id)` + a `typesReady`
  signal. The map is built once and reused; no refetch on repeat browsing.
- `PokemonCard` must handle the "Type not yet known" state gracefully (neutral → colour-in),
  which doubles as a mild resilience win if a `/type` set fails.
- Consistent with ADR 0001 (scroll stays network-paged) and NFR-1 (no per-card fetch on the
  scroll path). Recorded so a future reader doesn't "optimise" card colour into a per-card
  request and reintroduce scroll jank.
</content>
