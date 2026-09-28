# 0008 — Entry id vs species id (two identifiers, distinct only for Forms)

PokeAPI exposes a Pokémon through two resources with **two different id spaces**, and the
distinction only surfaces for **Forms**:

- **Entry id** — `/pokemon/{id}`. 1–1025 for base Pokémon, **10001+** for Forms. This is the
  number we **display**, derive the **artwork** URL from, order **browse/swipe** by, and key
  `pokemon:{id}` on.
- **Species id** — `/pokemon-species/{id}`. For the main range this **is the National Dex
  number**. It keys `species:{speciesId}` and leads to the Evolution chain.

For a **base** Pokémon the two coincide (Charizard is entry 6 *and* species 6). For a **Form**
they diverge: Mega Charizard X is **entry 10034**, but its `/pokemon` response points its
`species` at **`/pokemon-species/6/`** — there is **no** `/pokemon-species/10034`.

## The bug this avoids

If detail called `getSpecies(entryId)`, then for every one of the 326 Forms
`/pokemon-species/10034` would **404**, breaking the About and Evolution tabs. The `Pokemon`
model also carried no species reference to recover the real id.

## Decision

- Keep `id` = **entry id** on `Pokemon` / `PokemonSummary` (display, URLs, swipe, artwork,
  `pokemon:{id}`).
- Add **`Pokemon.speciesId`**, mapped from the `/pokemon` response's `species` ref. This is the
  Dex number.
- Fetch flow: `getPokemon(entryId)` → read `speciesId` → `getSpecies(speciesId)` →
  `getEvolution(chainId)`; cache species/evolution by **species id** / **chain id**.

## Consequences

- A **Form and its base share** one `species:{speciesId}` and one `evolution:{chainId}` cache
  entry (viewing either warms both).
- A Form's Evolution tab shows the **base species' line** (the only line PokeAPI has), and the
  "current stage" highlight matches **by species id**, so it highlights the base stage.
- We do **not** model a separate display `dexNumber`: Forms display their own entry id as their
  number (per PRD/DESIGN), so `speciesId` exists purely to fetch the right species.
- Recorded so a future reader does not "simplify" `getSpecies` to reuse the entry id and
  reintroduce 404s on every Form.
