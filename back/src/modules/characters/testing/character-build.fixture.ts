import { AbilityAssignment, type AbilityBonuses } from '../domain/ability-assignment';
import { AbilityRoll } from '../domain/ability-roll';
import { CharacterChoices, type CharacterChoice } from '../domain/character-choices';
import { CharacterEquipment } from '../domain/character-equipment';
import type { AbilityRecord } from '../domain/reference/abilities';
import type {
  BackgroundKey,
  ClassKey,
  LineageKey,
  SpeciesKey,
} from '../domain/reference/keys';
import { LEVEL_ONE, type CharacterBuild } from '../domain/resolution/character-build';

/**
 * Six lancers de 4d6 dont les trois meilleurs dés donnent 15/14/13/12/10/8.
 * Un tirage figé, pour que les cas concrets restent lisibles : ce qu'on teste
 * ici est la résolution, pas le hasard.
 */
export const STANDARD_ARRAY_DICE: readonly (readonly number[])[] = [
  [6, 5, 4, 1],
  [6, 4, 4, 2],
  [5, 4, 4, 3],
  [4, 4, 4, 1],
  [4, 3, 3, 2],
  [3, 3, 2, 1],
];

export const STANDARD_ARRAY_ROLL = AbilityRoll.create(STANDARD_ARRAY_DICE);

export interface BuildDraft {
  speciesKey: SpeciesKey;
  classKey: ClassKey;
  backgroundKey: BackgroundKey;
  base: AbilityRecord;
  backgroundBonuses: AbilityBonuses;
  lineageKey?: LineageKey | null;
  choices?: readonly CharacterChoice[];
  armorKey?: string | null;
  shield?: boolean;
}

export function aBuild(draft: BuildDraft): CharacterBuild {
  return {
    speciesKey: draft.speciesKey,
    lineageKey: draft.lineageKey ?? null,
    classKey: draft.classKey,
    backgroundKey: draft.backgroundKey,
    level: LEVEL_ONE,
    abilities: abilitiesOf(draft),
    choices: CharacterChoices.create(draft.choices ?? []),
    equipment: equipmentOf(draft),
  };
}

function abilitiesOf(draft: BuildDraft): AbilityAssignment {
  return AbilityAssignment.create({
    roll: STANDARD_ARRAY_ROLL,
    base: draft.base,
    backgroundBonuses: draft.backgroundBonuses,
  });
}

function equipmentOf(draft: BuildDraft): CharacterEquipment {
  return CharacterEquipment.create({
    armorKey: draft.armorKey ?? null,
    shield: draft.shield ?? false,
    items: [],
    gold: 0,
  });
}
