/**
 * A Pokémon's six base stats plus their sum. The `total` is carried on the model
 * (summed once at the data boundary) so the Base Stats tab can show it without
 * re-adding on every render.
 */
export interface StatSet {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  total: number;
}
