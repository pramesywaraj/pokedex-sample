import { matchesQuery } from './matches-query';

describe('matchesQuery', () => {
  const pikachu = { id: 25, name: 'Pikachu' };

  it('matches part of the name, ignoring case', () => {
    expect(matchesQuery(pikachu, 'PIKA')).toBe(true);
    expect(matchesQuery(pikachu, 'chu')).toBe(true);
  });

  it('matches part of the number', () => {
    expect(matchesQuery(pikachu, '25')).toBe(true);
    expect(matchesQuery({ id: 10025, name: 'Pikachu Cosplay' }, '002')).toBe(true);
  });

  it('ignores spaces around the query', () => {
    expect(matchesQuery(pikachu, '  pika ')).toBe(true);
  });

  it('does not match something unrelated', () => {
    expect(matchesQuery(pikachu, 'char')).toBe(false);
    expect(matchesQuery(pikachu, '99')).toBe(false);
  });

  it('matches anything for a blank query, so callers decide what blank means', () => {
    expect(matchesQuery(pikachu, '')).toBe(true);
    expect(matchesQuery(pikachu, '   ')).toBe(true);
  });
});
