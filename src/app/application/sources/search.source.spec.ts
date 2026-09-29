import { PokemonSummary } from '../../domain/pokemon-summary';
import { SEARCH_PAGE_SIZE, SearchPokemonSource } from './search.source';

function summary(id: number): PokemonSummary {
  return { id, name: `P${id}`, artworkUrl: `art/${id}.png` };
}

function makeResults(count: number): PokemonSummary[] {
  return Array.from({ length: count }, (_, i) => summary(i + 1));
}

describe('SearchPokemonSource', () => {
  it('reveals results a page at a time', async () => {
    const source = new SearchPokemonSource();
    source.setResults(makeResults(SEARCH_PAGE_SIZE + 3));

    const first = await source.loadNext();
    expect(first.items).toHaveLength(SEARCH_PAGE_SIZE);
    expect(first.hasMore).toBe(true);

    const second = await source.loadNext();
    expect(second.items).toHaveLength(3);
    expect(second.hasMore).toBe(false);
  });

  it('reports hasMore false straight away when the set fits in one page', async () => {
    const source = new SearchPokemonSource();
    source.setResults(makeResults(5));
    const page = await source.loadNext();
    expect(page.hasMore).toBe(false);
  });

  it('rewinds the cursor when setResults is called again', async () => {
    const source = new SearchPokemonSource();
    source.setResults(makeResults(SEARCH_PAGE_SIZE + 3));
    await source.loadNext();

    source.setResults(makeResults(2));
    const page = await source.loadNext();
    expect(page.items.map((p) => p.id)).toEqual([1, 2]);
    expect(page.hasMore).toBe(false);
  });
});
