import { pokemonTypeNames } from '../domain/pokemon-type-name';
import { typeColour, typeColours } from './type-colours';

describe('type-colours map', () => {
  it('resolves all 18 Types', () => {
    expect(Object.keys(typeColours)).toHaveLength(18);
    for (const name of pokemonTypeNames) {
      expect(typeColours[name]).toBeDefined();
    }
  });

  it('gives every Type a valid hex fill colour', () => {
    for (const name of pokemonTypeNames) {
      expect(typeColours[name].hex).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('gives every Type a black-or-white contrast label', () => {
    for (const name of pokemonTypeNames) {
      expect(['black', 'white']).toContain(typeColours[name].label);
    }
  });

  it('looks a Type up by name via typeColour()', () => {
    expect(typeColour('fire')).toEqual({ hex: '#F57D31', label: 'white' });
    expect(typeColour('electric').label).toBe('black');
  });
});
