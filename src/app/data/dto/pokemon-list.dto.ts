/** A `{ name, url }` reference, as PokeAPI returns it inside list responses. */
export interface NamedApiResource {
  name: string;
  url: string;
}

/** The `GET /pokemon?offset&limit` list response shape (pagination). */
export interface PokemonListDto {
  count: number;
  next: string | null;
  previous: string | null;
  results: NamedApiResource[];
}
