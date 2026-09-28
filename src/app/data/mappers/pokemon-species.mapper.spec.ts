import { PokemonSpeciesDto } from '../dto/pokemon-species.dto';
import { cleanFlavorText, toSpecies } from './pokemon-species.mapper';

function speciesDto(overrides: Partial<PokemonSpeciesDto> = {}): PokemonSpeciesDto {
  return {
    id: 6,
    name: 'charizard',
    genera: [
      { genus: 'かえん', language: { name: 'ja', url: '' } },
      { genus: 'Flame Pokémon', language: { name: 'en', url: '' } },
    ],
    flavor_text_entries: [
      { flavor_text: 'それは　ほのお', language: { name: 'ja', url: '' } },
      {
        flavor_text: 'Spits fire that\nis hot enough to\fmelt boulders.',
        language: { name: 'en', url: '' },
      },
    ],
    evolution_chain: { url: 'https://pokeapi.co/api/v2/evolution-chain/2/' },
    ...overrides,
  };
}

describe('cleanFlavorText', () => {
  it('collapses newlines, form feeds and soft hyphens into single spaces', () => {
    expect(cleanFlavorText('a\nb\fc­d')).toBe('a b cd');
  });

  it('trims and collapses surrounding whitespace', () => {
    expect(cleanFlavorText('  spits   fire  ')).toBe('spits fire');
  });
});

describe('toSpecies', () => {
  it('picks the English genus and cleaned English blurb', () => {
    const species = toSpecies(speciesDto());
    expect(species.category).toBe('Flame Pokémon');
    expect(species.description).toBe('Spits fire that is hot enough to melt boulders.');
  });

  it('parses the evolution chain id from the DTO url', () => {
    expect(toSpecies(speciesDto()).evolutionChainId).toBe(2);
  });

  it('falls back to empty strings when English entries are absent', () => {
    const species = toSpecies(speciesDto({ genera: [], flavor_text_entries: [] }));
    expect(species.category).toBe('');
    expect(species.description).toBe('');
  });
});
