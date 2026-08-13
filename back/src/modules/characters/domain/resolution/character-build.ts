import type { AbilityAssignment } from '../ability-assignment';
import type { CharacterChoices } from '../character-choices';
import type { CharacterEquipment } from '../character-equipment';
import type { BackgroundKey, ClassKey, LineageKey, SpeciesKey } from '../reference/keys';

/**
 * Tout ce dont le moteur a besoin pour produire une fiche : les choix du joueur,
 * et rien d'autre. Aucune valeur dérivée n'entre ici — ni PV, ni CA, ni
 * initiative. Elles sortent du moteur, elles n'y entrent jamais.
 *
 * C'est volontairement un type de données et non l'agrégat `Character` : la
 * prévisualisation du wizard résout un build qui n'est pas encore persisté.
 */
export interface CharacterBuild {
  speciesKey: SpeciesKey;
  lineageKey: LineageKey | null;
  classKey: ClassKey;
  backgroundKey: BackgroundKey;
  level: number;
  abilities: AbilityAssignment;
  choices: CharacterChoices;
  equipment: CharacterEquipment;
}

export const LEVEL_ONE = 1;
