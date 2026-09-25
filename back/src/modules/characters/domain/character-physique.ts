import { InvalidCharacterIdentityError, type CharacterIdentitySnapshot } from './character-identity';
import type { SpeciesKey } from './reference/keys';
import type { CreatureSize } from './reference/proficiencies';
import {
  SPECIES,
  SPECIES_PHYSICAL_BOUNDS,
  type MeasurementRange,
} from './reference/species';

export function sizeFromHeight(speciesKey: SpeciesKey, heightCm: number): CreatureSize {
  const threshold = SPECIES_PHYSICAL_BOUNDS[speciesKey].mediumFromHeightCm;
  if (threshold === null) return SPECIES[speciesKey].size;

  return heightCm < threshold ? 'Small' : 'Medium';
}

/** L'aperçu répond avant que la taille soit saisie : l'espèce donne alors sa catégorie par défaut. */
export function previewSizeOf(speciesKey: SpeciesKey, heightCm: number | undefined): CreatureSize {
  if (heightCm === undefined) return SPECIES[speciesKey].size;
  return sizeFromHeight(speciesKey, heightCm);
}

export function assertSpeciesPhysique(
  speciesKey: SpeciesKey,
  identity: CharacterIdentitySnapshot,
): void {
  const bounds = SPECIES_PHYSICAL_BOUNDS[speciesKey];
  const measuresAreValid = inRange(identity.heightCm, bounds.heightCm)
    && inRange(identity.weightKg, bounds.weightKg);
  if (!measuresAreValid) throw new InvalidCharacterIdentityError();
}

function inRange(value: number, range: MeasurementRange): boolean {
  return value >= range.min && value <= range.max;
}
