/**
 * True when the search text appears in a Pokémon's name (any case) or in its
 * number. Browse search and the Favourites search both use it, so the two
 * screens always agree on what counts as a match.
 */
export function matchesQuery(item: { id: number; name: string }, text: string): boolean {
  const query = text.trim().toLowerCase();
  return item.name.toLowerCase().includes(query) || String(item.id).includes(query);
}
