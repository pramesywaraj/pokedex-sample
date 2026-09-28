/**
 * The 18 canonical Pokémon Type names, lower-cased exactly as PokeAPI returns
 * them. Kept as a `const` tuple so callers can iterate the full set at runtime
 * (Type chips, the colour map) while the union type below stays derived from it.
 */
export const pokemonTypeNames = [
  'normal',
  'fire',
  'water',
  'grass',
  'electric',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

/** An elemental Type a Pokémon belongs to; a Pokémon has one or two. */
export type PokemonTypeName = (typeof pokemonTypeNames)[number];
