import { PokemonListDto } from '../dto/pokemon-list.dto';
import {
  idFromResourceUrl,
  titleCaseName,
  toPokemonSummaries,
  toPokemonSummary,
} from './pokemon-summary.mapper';

describe('pokemon-summary mapper', () => {
  describe('idFromResourceUrl', () => {
    it('parses the entry id from a list resource url', () => {
      expect(idFromResourceUrl('https://pokeapi.co/api/v2/pokemon/25/')).toBe(25);
    });

    it('parses a Form id at the 10001+ range', () => {
      expect(idFromResourceUrl('https://pokeapi.co/api/v2/pokemon/10001/')).toBe(10001);
    });

    it('throws on an unrecognised url', () => {
      expect(() => idFromResourceUrl('https://pokeapi.co/api/v2/pokemon/')).toThrow();
    });
  });

  describe('titleCaseName', () => {
    it('title-cases a plain name', () => {
      expect(titleCaseName('bulbasaur')).toBe('Bulbasaur');
    });

    it('de-hyphenates and title-cases each word', () => {
      expect(titleCaseName('mr-mime')).toBe('Mr Mime');
      expect(titleCaseName('charizard-mega-x')).toBe('Charizard Mega X');
    });
  });

  describe('toPokemonSummary', () => {
    it('maps a list ref to id, display name and derived artwork', () => {
      const summary = toPokemonSummary({
        name: 'pikachu',
        url: 'https://pokeapi.co/api/v2/pokemon/25/',
      });
      expect(summary.id).toBe(25);
      expect(summary.name).toBe('Pikachu');
      expect(summary.artworkUrl).toContain('official-artwork/25.png');
    });
  });

  describe('toPokemonSummaries', () => {
    it('maps a page preserving list order', () => {
      const dto: PokemonListDto = {
        count: 2,
        next: 'https://pokeapi.co/api/v2/pokemon?offset=20&limit=20',
        previous: null,
        results: [
          { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
          { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
        ],
      };
      expect(toPokemonSummaries(dto).map((p) => p.id)).toEqual([1, 2]);
      expect(toPokemonSummaries(dto).map((p) => p.name)).toEqual(['Bulbasaur', 'Ivysaur']);
    });
  });
});
