import { pokemonTypeNames, typeLabel } from './pokemon-type-name';

describe('typeLabel', () => {
  it('capitalises a Type slug for display', () => {
    expect(typeLabel('grass')).toBe('Grass');
    expect(typeLabel('fighting')).toBe('Fighting');
  });

  it('gives every Type a non-empty label', () => {
    for (const name of pokemonTypeNames) {
      expect(typeLabel(name)).toMatch(/^[A-Z]/);
    }
  });
});
