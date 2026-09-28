import { PokemonTypeName } from '../domain/pokemon-type-name';

export interface TypeColour {
  hex: string;
  label: 'black' | 'white';
}

/**
 * The single source of truth for Type tinting at runtime — cards, badges,
 * chips, and detail headers look each Type up here.
 */
export const typeColours: Record<PokemonTypeName, TypeColour> = {
  normal: { hex: '#AAA67F', label: 'black' },
  fire: { hex: '#F57D31', label: 'white' },
  water: { hex: '#6493EB', label: 'white' },
  grass: { hex: '#74CB48', label: 'white' },
  electric: { hex: '#F9CF30', label: 'black' },
  ice: { hex: '#9AD6DF', label: 'black' },
  fighting: { hex: '#C12239', label: 'white' },
  poison: { hex: '#A33EA1', label: 'white' },
  ground: { hex: '#DEC16B', label: 'black' },
  flying: { hex: '#A891EC', label: 'black' },
  psychic: { hex: '#FB5584', label: 'white' },
  bug: { hex: '#A7B723', label: 'black' },
  rock: { hex: '#B69E31', label: 'black' },
  ghost: { hex: '#70559B', label: 'white' },
  dragon: { hex: '#7037FF', label: 'white' },
  dark: { hex: '#75574C', label: 'white' },
  steel: { hex: '#B7B9D0', label: 'black' },
  fairy: { hex: '#E69EAC', label: 'black' },
};

/** Looks up a Type's fill hue and contrast label for runtime tinting. */
export function typeColour(name: PokemonTypeName): TypeColour {
  return typeColours[name];
}
