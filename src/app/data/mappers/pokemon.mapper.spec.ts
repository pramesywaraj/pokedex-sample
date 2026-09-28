import { PokemonDto } from '../dto/pokemon.dto';
import { toPokemon } from './pokemon.mapper';

function charizardDto(overrides: Partial<PokemonDto> = {}): PokemonDto {
  return {
    id: 6,
    name: 'charizard',
    height: 17,
    weight: 905,
    types: [
      { slot: 2, type: { name: 'flying', url: 'https://pokeapi.co/api/v2/type/3/' } },
      { slot: 1, type: { name: 'fire', url: 'https://pokeapi.co/api/v2/type/10/' } },
    ],
    stats: [
      { base_stat: 78, stat: { name: 'hp', url: '' } },
      { base_stat: 84, stat: { name: 'attack', url: '' } },
      { base_stat: 78, stat: { name: 'defense', url: '' } },
      { base_stat: 109, stat: { name: 'special-attack', url: '' } },
      { base_stat: 85, stat: { name: 'special-defense', url: '' } },
      { base_stat: 100, stat: { name: 'speed', url: '' } },
    ],
    abilities: [
      { ability: { name: 'blaze', url: '' }, is_hidden: false },
      { ability: { name: 'solar-power', url: '' }, is_hidden: true },
    ],
    sprites: { front_default: 'front.png', back_default: 'back.png' },
    species: { name: 'charizard', url: 'https://pokeapi.co/api/v2/pokemon-species/6/' },
    ...overrides,
  };
}

describe('toPokemon', () => {
  it('maps id, display name and derived image URLs', () => {
    const pokemon = toPokemon(charizardDto());
    expect(pokemon.id).toBe(6);
    expect(pokemon.name).toBe('Charizard');
    expect(pokemon.artworkUrl).toContain('official-artwork/6.png');
    expect(pokemon.frontSpriteUrl).toContain('/pokemon/6.png');
    expect(pokemon.backSpriteUrl).toContain('/pokemon/back/6.png');
  });

  it('reads the species id from the species ref, not the entry id (ADR 0008)', () => {
    const mega = toPokemon(
      charizardDto({
        id: 10034,
        species: { name: 'charizard', url: 'https://pokeapi.co/api/v2/pokemon-species/6/' },
      }),
    );
    expect(mega.id).toBe(10034);
    expect(mega.speciesId).toBe(6);
  });

  it('orders Types by slot so the primary comes first', () => {
    expect(toPokemon(charizardDto()).types).toEqual(['fire', 'flying']);
  });

  it('converts height and weight to metric', () => {
    const pokemon = toPokemon(charizardDto());
    expect(pokemon.heightM).toBe(1.7);
    expect(pokemon.weightKg).toBe(90.5);
  });

  it('fills the six stats and sums the total', () => {
    const { stats } = toPokemon(charizardDto());
    expect(stats).toEqual({
      hp: 78,
      attack: 84,
      defense: 78,
      specialAttack: 109,
      specialDefense: 85,
      speed: 100,
      total: 534,
    });
  });

  it('title-cases and de-hyphenates ability names', () => {
    expect(toPokemon(charizardDto()).abilities).toEqual(['Blaze', 'Solar Power']);
  });

  it('title-cases a hyphenated Form name', () => {
    const mega = toPokemon(charizardDto({ id: 10034, name: 'charizard-mega-x' }));
    expect(mega.name).toBe('Charizard Mega X');
  });

  it('leaves the back sprite null when the DTO has none', () => {
    const pokemon = toPokemon(
      charizardDto({ sprites: { front_default: 'front.png', back_default: null } }),
    );
    expect(pokemon.backSpriteUrl).toBeNull();
  });
});
