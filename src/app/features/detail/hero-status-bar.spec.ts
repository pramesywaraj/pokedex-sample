import { describe, expect, it } from 'vitest';
import { heroStatusBarContent } from './hero-status-bar';

describe('heroStatusBarContent', () => {
  it('takes the primary Type label colour once the Pokémon has landed', () => {
    expect(heroStatusBarContent('ready', 'dragon')).toBe('white');
    expect(heroStatusBarContent('ready', 'electric')).toBe('black');
  });

  it('goes white over the mystery panel of a not found', () => {
    expect(heroStatusBarContent('notFound', undefined)).toBe('white');
  });

  it('stays black over the pale skeleton and error canvas', () => {
    expect(heroStatusBarContent('loading', undefined)).toBe('black');
    expect(heroStatusBarContent('error', undefined)).toBe('black');
  });

  it('stays black when a landed Pokémon has no Type to colour the hero', () => {
    expect(heroStatusBarContent('ready', undefined)).toBe('black');
  });
});
