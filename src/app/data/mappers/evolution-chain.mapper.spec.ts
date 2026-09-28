import { ChainLinkDto, EvolutionChainDto, EvolutionDetailDto } from '../dto/evolution-chain.dto';
import { toEvolutionChain } from './evolution-chain.mapper';

function detail(over: Partial<EvolutionDetailDto> = {}): EvolutionDetailDto {
  return { min_level: null, item: null, trigger: null, min_happiness: null, ...over };
}

function link(
  id: number,
  name: string,
  evolvesTo: ChainLinkDto[] = [],
  details: EvolutionDetailDto[] = [],
): ChainLinkDto {
  return {
    species: { name, url: `https://pokeapi.co/api/v2/pokemon-species/${id}/` },
    evolution_details: details,
    evolves_to: evolvesTo,
  };
}

function chain(root: ChainLinkDto, id = 1): EvolutionChainDto {
  return { id, chain: root };
}

describe('toEvolutionChain', () => {
  it('flattens a straight line into one step per edge, in order', () => {
    const dto = chain(
      link(1, 'bulbasaur', [
        link(
          2,
          'ivysaur',
          [link(3, 'venusaur', [], [detail({ min_level: 32 })])],
          [detail({ min_level: 16 })],
        ),
      ]),
    );
    const result = toEvolutionChain(dto);
    expect(result.chainId).toBe(1);
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].from.name).toBe('Bulbasaur');
    expect(result.steps[0].to.name).toBe('Ivysaur');
    expect(result.steps[0].to.speciesId).toBe(2);
    expect(result.steps[0].method).toBe('Lv. 16');
    expect(result.steps[1].method).toBe('Lv. 32');
    expect(result.steps[0].to.artworkUrl).toContain('/2.png');
  });

  it('emits a sibling step per branch', () => {
    const dto = chain(
      link(133, 'eevee', [
        link(134, 'vaporeon', [], [detail({ item: { name: 'water-stone', url: '' } })]),
        link(135, 'jolteon', [], [detail({ item: { name: 'thunder-stone', url: '' } })]),
      ]),
    );
    const result = toEvolutionChain(dto);
    expect(result.steps.map((s) => s.to.name)).toEqual(['Vaporeon', 'Jolteon']);
    expect(result.steps[0].method).toBe('Use Water Stone');
  });

  it('gives a non-evolver no steps', () => {
    const result = toEvolutionChain(chain(link(128, 'tauros'), 60));
    expect(result.steps).toEqual([]);
  });

  it('labels a trade and a friendship evolution', () => {
    const trade = toEvolutionChain(
      chain(
        link(95, 'onix', [
          link(208, 'steelix', [], [detail({ trigger: { name: 'trade', url: '' } })]),
        ]),
      ),
    );
    expect(trade.steps[0].method).toBe('Trade');
    const friendship = toEvolutionChain(
      chain(link(172, 'pichu', [link(25, 'pikachu', [], [detail({ min_happiness: 220 })])])),
    );
    expect(friendship.steps[0].method).toBe('Friendship');
  });
});
