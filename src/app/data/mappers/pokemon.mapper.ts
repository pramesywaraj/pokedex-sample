import { Pokemon } from '../../domain/pokemon';
import { PokemonTypeName } from '../../domain/pokemon-type-name';
import { StatSet } from '../../domain/stat-set';
import { PokemonDto } from '../dto/pokemon.dto';
import { idFromResourceUrl, titleCaseName } from './pokemon-summary.mapper';
import { artworkUrlFor, backSpriteUrlFor, frontSpriteUrlFor } from './sprite-urls';

/** Maps a PokeAPI stat slug to the field it fills on the domain `StatSet`. */
const STAT_FIELD: Record<string, keyof Omit<StatSet, 'total'>> = {
  hp: 'hp',
  attack: 'attack',
  defense: 'defense',
  'special-attack': 'specialAttack',
  'special-defense': 'specialDefense',
  speed: 'speed',
};

/** Folds the DTO's stat list into the six named stats and their summed total. */
function toStatSet(dto: PokemonDto): StatSet {
  const stats: StatSet = {
    hp: 0,
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
    total: 0,
  };
  for (const entry of dto.stats) {
    const field = STAT_FIELD[entry.stat.name];
    if (field) {
      stats[field] = entry.base_stat;
      stats.total += entry.base_stat;
    }
  }
  return stats;
}

/** Reads the Types in slot order so `types[0]` is always the primary Type. */
function toTypes(dto: PokemonDto): PokemonTypeName[] {
  return [...dto.types]
    .sort((a, b) => a.slot - b.slot)
    .map((slot) => slot.type.name as PokemonTypeName);
}

/**
 * Maps a `/pokemon/{id}` response to the domain `Pokemon`: id and derived image
 * URLs, the Dex number read from the species ref, slot-ordered Types, physical
 * attributes in metric, the summed stats, and title-cased abilities. The back
 * sprite is null when the DTO has none, so Detail can hide the flip.
 */
export function toPokemon(dto: PokemonDto): Pokemon {
  return {
    id: dto.id,
    speciesId: idFromResourceUrl(dto.species.url),
    name: titleCaseName(dto.name),
    types: toTypes(dto),
    heightM: dto.height / 10,
    weightKg: dto.weight / 10,
    stats: toStatSet(dto),
    abilities: dto.abilities.map((a) => titleCaseName(a.ability.name)),
    artworkUrl: artworkUrlFor(dto.id),
    frontSpriteUrl: frontSpriteUrlFor(dto.id),
    backSpriteUrl: dto.sprites.back_default === null ? null : backSpriteUrlFor(dto.id),
  };
}
