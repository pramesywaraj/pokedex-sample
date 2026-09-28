import { Injectable, computed, inject, signal } from '@angular/core';
import { AppError } from '../domain/app-error';
import { Pokemon } from '../domain/pokemon';
import { Species } from '../domain/species';
import { PokemonRepository } from '../data/repository/pokemon.repository';

/** Whole-page state of one detail screen, driven by the core `/pokemon` fetch. */
export type DetailStatus = 'loading' | 'ready' | 'notFound' | 'error';
/** The species read's own state, so a failed description is a per-tab error, not whole-page. */
export type DescriptionStatus = 'loading' | 'ready' | 'error';

/**
 * Owns a single detail screen. Provided per DetailPage (not root) so evolution
 * jumps keep their own state while the cache stays app-wide.
 */
@Injectable()
export class DetailService {
  private readonly repository = inject(PokemonRepository);

  private readonly _status = signal<DetailStatus>('loading');
  private readonly _pokemon = signal<Pokemon | undefined>(undefined);
  private readonly _species = signal<Species | undefined>(undefined);
  private readonly _descriptionStatus = signal<DescriptionStatus>('loading');

  /** Whole-page state: skeleton, the detail, not-found, or a retryable error. */
  readonly status = this._status.asReadonly();
  /** The core Pokémon, once the `/pokemon` read lands. */
  readonly pokemon = this._pokemon.asReadonly();
  /** The species, once the `/pokemon-species` read lands. */
  readonly species = this._species.asReadonly();
  /** State of the species read, driving the About description's per-tab states. */
  readonly descriptionStatus = this._descriptionStatus.asReadonly();

  /** The category label ("Seed Pokémon"), from the species. */
  readonly category = computed(() => this._species()?.category);
  /** The cleaned Pokédex blurb, from the species. */
  readonly description = computed(() => this._species()?.description);

  private entryId = 0;

  /**
   * Loads the detail for an entry id: fetches the core Pokémon, then its species
   * by the species id it points at. A 404 lands on not-found, any other core
   * failure on the whole-page error.
   */
  async load(entryId: number): Promise<void> {
    this.entryId = entryId;
    this._status.set('loading');
    this._pokemon.set(undefined);
    this._species.set(undefined);
    try {
      const pokemon = await this.repository.getPokemon(entryId);
      this._pokemon.set(pokemon);
      this._status.set('ready');
      await this.loadSpecies(pokemon.speciesId);
    } catch (error) {
      const notFound = error instanceof AppError && error.kind === 'notFound';
      this._status.set(notFound ? 'notFound' : 'error');
    }
  }

  /** Retries the whole-page core fetch after an error. */
  retry(): Promise<void> {
    return this.load(this.entryId);
  }

  /** Retries just the species read after a per-tab description failure. */
  retryDescription(): Promise<void> {
    const pokemon = this._pokemon();
    return pokemon ? this.loadSpecies(pokemon.speciesId) : Promise.resolve();
  }

  /** Fetches the species by species id; its failure stays a per-tab error. */
  private async loadSpecies(speciesId: number): Promise<void> {
    this._descriptionStatus.set('loading');
    try {
      this._species.set(await this.repository.getSpecies(speciesId));
      this._descriptionStatus.set('ready');
    } catch {
      this._descriptionStatus.set('error');
    }
  }
}
