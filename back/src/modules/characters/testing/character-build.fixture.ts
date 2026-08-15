import { AbilityAssignment, type AbilityBonuses } from '../domain/ability-assignment';
import type { AbilityMethod } from '../domain/ability-generation';
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

export interface BuildInput {
  speciesKey: SpeciesKey;
  classKey: ClassKey;
  backgroundKey: BackgroundKey;
  base: AbilityRecord;
  backgroundBonuses: AbilityBonuses;
  lineageKey?: LineageKey | null;
  abilityMethod?: AbilityMethod;
  choices?: readonly CharacterChoice[];
  armorKey?: string | null;
  shield?: boolean;
}

export function aBuild(input: BuildInput): CharacterBuild {
  return {
    speciesKey: input.speciesKey,
    lineageKey: input.lineageKey ?? null,
    classKey: input.classKey,
    backgroundKey: input.backgroundKey,
    level: LEVEL_ONE,
    abilities: abilitiesOf(input),
    choices: CharacterChoices.create(input.choices ?? []),
    equipment: equipmentOf(input),
  };
}

function abilitiesOf(input: BuildInput): AbilityAssignment {
  return AbilityAssignment.create({
    method: input.abilityMethod ?? 'roll',
    roll: STANDARD_ARRAY_ROLL,
    base: input.base,
    backgroundBonuses: input.backgroundBonuses,
  });
}

function equipmentOf(input: BuildInput): CharacterEquipment {
  return CharacterEquipment.create({
    armorKey: input.armorKey ?? null,
    shield: input.shield ?? false,
    items: [],
    gold: 0,
  });
}
