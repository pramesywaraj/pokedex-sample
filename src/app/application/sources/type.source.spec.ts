import { TestBed } from '@angular/core/testing';
import { PokemonSummary } from '../../domain/pokemon-summary';
import { PokemonTypeName } from '../../domain/pokemon-type-name';
import { PokemonRepository } from '../../data/repository/pokemon.repository';
import { TYPE_PAGE_SIZE, TypePokemonSource } from './type.source';

function summary(id: number): PokemonSummary {
  return { id, name: `P${id}`, artworkUrl: `art/${id}.png` };
}

function makeResults(count: number): PokemonSummary[] {
  return Array.from({ length: count }, (_, i) => summary(i + 1));
}

class FakeRepository {
  calls: PokemonTypeName[] = [];
  outcomes: (PokemonSummary[] | Error)[] = [];

  getByType(name: PokemonTypeName): Promise<PokemonSummary[]> {
    this.calls.push(name);
    const outcome = this.outcomes.shift();
    if (outcome === undefined) {
      return Promise.resolve([]);
    }
    return outcome instanceof Error ? Promise.reject(outcome) : Promise.resolve(outcome);
  }
}

describe('TypePokemonSource', () => {
  let repo: FakeRepository;
  let source: TypePokemonSource;

  beforeEach(() => {
    repo = new FakeRepository();
    TestBed.configureTestingModule({
      providers: [
        TypePokemonSource,
        { provide: PokemonRepository, useValue: repo },
      ],
    });
    source = TestBed.inject(TypePokemonSource);
  });

  it('fetches the whole set on the first page and reveals a page at a time', async () => {
    repo.outcomes = [makeResults(TYPE_PAGE_SIZE + 3)];
    source.setType('fire');

    const first = await source.loadNext();
    expect(repo.calls).toEqual(['fire']);
    expect(first.items).toHaveLength(TYPE_PAGE_SIZE);
    expect(first.hasMore).toBe(true);

    const second = await source.loadNext();
    expect(repo.calls).toEqual(['fire']);
    expect(second.items).toHaveLength(3);
    expect(second.hasMore).toBe(false);
  });

  it('reports hasMore false straight away when the set fits in one page', async () => {
    repo.outcomes = [makeResults(4)];
    source.setType('water');
    const page = await source.loadNext();
    expect(page.items.map((p) => p.id)).toEqual([1, 2, 3, 4]);
    expect(page.hasMore).toBe(false);
  });

  it('re-fetches and rewinds when the Type changes', async () => {
    repo.outcomes = [makeResults(2), makeResults(1)];
    source.setType('fire');
    await source.loadNext();
    source.setType('water');
    const page = await source.loadNext();
    expect(repo.calls).toEqual(['fire', 'water']);
    expect(page.items.map((p) => p.id)).toEqual([1]);
    expect(page.hasMore).toBe(false);
  });

  it('yields an empty page when no Type has been set yet', async () => {
    const page = await source.loadNext();
    expect(page.items).toEqual([]);
    expect(page.hasMore).toBe(false);
    expect(repo.calls).toEqual([]);
  });

  it('surfaces a repository failure so the feed can drive its error state', async () => {
    repo.outcomes = [new Error('type fetch failed')];
    source.setType('fire');
    await expect(source.loadNext()).rejects.toThrow('type fetch failed');
  });
});
