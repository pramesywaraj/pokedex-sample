import { TypeDetailDto } from '../dto/type-detail.dto';
import { toTypeMembers } from './type.mapper';

describe('toTypeMembers', () => {
  it('reads each entry into its id and slot', () => {
    const dto: TypeDetailDto = {
      pokemon: [
        { slot: 1, pokemon: { name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4/' } },
        { slot: 2, pokemon: { name: 'onix', url: 'https://pokeapi.co/api/v2/pokemon/95/' } },
      ],
    };

    expect(toTypeMembers(dto)).toEqual([
      { id: 4, slot: 1, name: 'charmander' },
      { id: 95, slot: 2, name: 'onix' },
    ]);
  });

  it('handles Form ids from the 10001 plus range', () => {
    const dto: TypeDetailDto = {
      pokemon: [
        {
          slot: 1,
          pokemon: { name: 'deoxys-attack', url: 'https://pokeapi.co/api/v2/pokemon/10001/' },
        },
      ],
    };
    expect(toTypeMembers(dto)).toEqual([{ id: 10001, slot: 1, name: 'deoxys-attack' }]);
  });
});
