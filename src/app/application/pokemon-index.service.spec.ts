import { TestBed } from '@angular/core/testing';
import { PokemonSummary } from '../domain/pokemon-summary';
import { PokemonTypeName } from '../domain/pokemon-type-name';
import { PokemonRepository, TypeIndex } from '../data/repository/pokemon.repository';
import { PokemonIndexService } from './pokemon-index.service';

class FakeRepository {
  outcomes: (PokemonSummary[] | Error)[] = [];
  calls = 0;
  typeIndexOutcomes: (TypeIndex | Error)[] = [];
  typeIndexCalls = 0;

  getIndex(): Promise<PokemonSummary[]> {
    const outcome = this.outcomes[this.calls++];
    return outcome instanceof Error ? Promise.reject(outcome) : Promise.resolve(outcome);
  }

  getTypeIndex(): Promise<TypeIndex> {
    const outcome = this.typeIndexOutcomes[this.typeIndexCalls++];
    if (outcome === undefined) {
      return Promise.resolve(new Map());
    }
    return outcome instanceof Error ? Promise.reject(outcome) : Promise.resolve(outcome);
  }
}

function ti(entries: [id: number, types: PokemonTypeName[]][]): TypeIndex {
  return new Map(entries);
}

function s(id: number, name: string): PokemonSummary {
  return { id, name, artworkUrl: `art/${id}.png` };
}

describe('PokemonIndexService', () => {
  let repo: FakeRepository;
  let service: PokemonIndexService;

  beforeEach(() => {
    repo = new FakeRepository();
    TestBed.configureTestingModule({
      providers: [PokemonIndexService, { provide: PokemonRepository, useValue: repo }],
    });
    service = TestBed.inject(PokemonIndexService);
  });

  it('loads and exposes ready + items', async () => {
    repo.outcomes = [[s(1, 'Bulbasaur'), s(25, 'Pikachu')]];
    await service.load();
    expect(service.ready()).toBe(true);
    expect(service.error()).toBe(false);
    expect(service.items().map((i) => i.id)).toEqual([1, 25]);
  });

  it('flags error and stays not-ready on a failed load', async () => {
    repo.outcomes = [new Error('offline')];
    await service.load();
    expect(service.ready()).toBe(false);
    expect(service.error()).toBe(true);
    expect(service.disabled()).toBe(true);
  });

  it('recovers on retry after a failed load', async () => {
    repo.outcomes = [new Error('offline'), [s(1, 'Bulbasaur')]];
    await service.load();
    await service.retry();
    expect(service.ready()).toBe(true);
    expect(service.error()).toBe(false);
    expect(service.disabled()).toBe(false);
  });

  it('coalesces concurrent loads onto one in-flight promise', async () => {
    repo.outcomes = [[s(1, 'Bulbasaur')]];
    await Promise.all([service.load(), service.load(), service.load()]);
    expect(repo.calls).toBe(1);
  });

  it('does not re-fetch once ready', async () => {
    repo.outcomes = [[s(1, 'Bulbasaur')]];
    await service.load();
    await service.load();
    expect(repo.calls).toBe(1);
  });

  describe('after loading', () => {
    beforeEach(async () => {
      repo.outcomes = [[s(1, 'Bulbasaur'), s(25, 'Pikachu'), s(10001, 'Deoxys Attack')]];
      await service.load();
    });

    it('returns positions by id', () => {
      expect(service.positionOf(1)).toBe(0);
      expect(service.positionOf(25)).toBe(1);
      expect(service.positionOf(10001)).toBe(2);
      expect(service.positionOf(9999)).toBeUndefined();
    });

    it('returns neighbours across the 1025 to 10001 id gap', () => {
      expect(service.neighbours(1)).toEqual({ next: 25 });
      expect(service.neighbours(25)).toEqual({ prev: 1, next: 10001 });
      expect(service.neighbours(10001)).toEqual({ prev: 25 });
    });

    it('matches partially by name, case-insensitive', () => {
      const results = service.search('pika');
      expect(results.map((r) => r.id)).toEqual([25]);
    });

    it('matches by number substring', () => {
      const results = service.search('1000');
      expect(results.map((r) => r.id)).toEqual([10001]);
    });

    it('returns nothing for an empty query', () => {
      expect(service.search('')).toEqual([]);
      expect(service.search('   ')).toEqual([]);
    });
  });

  describe('type warm-up', () => {
    it('starts with typesReady false and typesOf returning undefined', () => {
      expect(service.typesReady()).toBe(false);
      expect(service.typesOf(1)).toBeUndefined();
    });

    it('folds the type index in and flips typesReady when the warm-up lands', async () => {
      repo.typeIndexOutcomes = [
        ti([
          [6, ['fire', 'flying']],
          [25, ['electric']],
        ]),
      ];
      await service.warmUpTypes();
      expect(service.typesReady()).toBe(true);
      expect(service.typesOf(6)).toEqual(['fire', 'flying']);
      expect(service.typesOf(25)).toEqual(['electric']);
      expect(service.typesOf(9999)).toBeUndefined();
    });

    it('coalesces concurrent warm-ups onto one repository call', async () => {
      repo.typeIndexOutcomes = [ti([[1, ['grass']]])];
      await Promise.all([service.warmUpTypes(), service.warmUpTypes(), service.warmUpTypes()]);
      expect(repo.typeIndexCalls).toBe(1);
    });

    it('does not re-fetch once the warm-up is ready', async () => {
      repo.typeIndexOutcomes = [ti([[1, ['grass']]])];
      await service.warmUpTypes();
      await service.warmUpTypes();
      expect(repo.typeIndexCalls).toBe(1);
    });

    it('leaves typesReady false when the warm-up fails so cards stay neutral', async () => {
      repo.typeIndexOutcomes = [new Error('offline')];
      await service.warmUpTypes();
      expect(service.typesReady()).toBe(false);
      expect(service.typesOf(1)).toBeUndefined();
    });
  });
});
