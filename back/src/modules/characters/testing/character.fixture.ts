import type { FinalizeCharacterDto } from '@donjon-dragon/shared/character-schema';

import type { CharacterBuildInput } from '../domain/character';
import { STANDARD_ARRAY_DICE, STANDARD_ARRAY_ROLL } from './character-build.fixture';

export const A_CHARACTER_NAME = 'Frodo Sacquet';

/** Les six totaux du tirage figé de `character-build.fixture` : 15/14/13/12/10/8. */
export const A_VALID_ASSIGNMENT = {
  strength: 8,
  dexterity: 15,
  constitution: 13,
  intelligence: 12,
  wisdom: 10,
  charisma: 14,
} as const;

/**
 * Un halfelin roublard charlatan : aucune espèce à lignage, un historique dont
 * le don n'exige rien de plus, et les quatre compétences de classe du roublard.
 * Le cas le plus simple qui passe toutes les vérifications de `finalize`.
 */
export const A_CHARACTER_BUILD: CharacterBuildInput = {
  speciesKey: 'halfling',
  lineageKey: null,
  classKey: 'rogue',
  backgroundKey: 'charlatan',
  abilityMethod: 'roll',
  base: { ...A_VALID_ASSIGNMENT },
  backgroundBonuses: { dexterity: 2, charisma: 1 },
  choices: [
    {
      source: { type: 'class', key: 'rogue' },
      skills: ['acrobatics', 'insight', 'perception', 'stealth'],
      expertise: ['stealth', 'perception'],
    },
  ],
  equipment: { armorKey: 'leather', shield: false, items: [], gold: 8 },
};

/**
 * Le même personnage, mais dans la forme que le wizard envoie : le corps HTTP
 * de `create` et de `finalize`, tirage compris.
 *
 * Il ne dérive pas de `A_CHARACTER_BUILD` : les deux formes se ressemblent sans
 * être la même chose — le contrat HTTP borne les bonus à 1 ou 2 et n'admet que
 * des tableaux mutables, là où le domaine est plus large. C'est le même écart
 * que traduit `character-build.mapper.ts`.
 */
const A_CHARACTER_BODY: FinalizeCharacterDto = {
  name: A_CHARACTER_NAME,
  speciesKey: 'halfling',
  lineageKey: null,
  classKey: 'rogue',
  backgroundKey: 'charlatan',
  abilityMethod: 'roll',
  base: { ...A_VALID_ASSIGNMENT },
  backgroundBonuses: { dexterity: 2, charisma: 1 },
  choices: [
    {
      source: { type: 'class', key: 'rogue' },
      skills: ['acrobatics', 'insight', 'perception', 'stealth'],
      expertise: ['stealth', 'perception'],
    },
  ],
  equipment: { armorKey: 'leather', shield: false, items: [], gold: 8 },
  abilityRoll: {
    dice: STANDARD_ARRAY_DICE.map((roll) => [...roll]),
    totals: STANDARD_ARRAY_ROLL.totals,
  },
};

/** Le même corps, sous le nom que le test veut donner à son personnage. */
export function aCharacterBody(name: string = A_CHARACTER_NAME): FinalizeCharacterDto {
  return { ...A_CHARACTER_BODY, name };
}
