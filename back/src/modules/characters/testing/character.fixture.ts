import type {
  CreateCharacterDto,
  FinalizeCharacterDto,
} from '@donjon-dragon/shared/character-schema';

import type { UserId } from '@kernel/domain/user-id';

import type { CharacterBuildInput } from '../domain/character';
import { STANDARD_ARRAY_DICE } from './character-build.fixture';
import type { InMemoryAbilityRollRepository } from './in-memory-ability-roll.repository';

export const A_CHARACTER_NAME = 'Frodo Sacquet';

/** Le tirage que le serveur est censé avoir émis avant ce corps de requête. */
export const A_ABILITY_ROLL_ID = 'b1e3a0f4-7c2d-4a51-9f60-2d8c4b7e1a03';
export const A_CHARACTER_IDENTITY = {
  alignment: 'neutralGood' as const,
  age: 33,
  heightCm: 90,
  weightKg: 18,
  description: 'Un voyageur prudent aux yeux vifs.',
};

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
  standardLanguages: ['elvish', 'dwarvish'],
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
      languages: ['gnomish'],
      weaponMasteries: ['dagger', 'shortbow'],
    },
    {
      source: { type: 'feat', key: 'skilled' },
      skills: ['arcana', 'history', 'medicine'],
    },
  ],
  equipment: {
    armorKey: null,
    shield: false,
    items: [],
    gold: 0,
    classOptionId: 'B',
    backgroundOptionId: 'B',
  },
};

/**
 * Le même personnage, mais dans la forme que le wizard envoie : le corps HTTP
 * du `POST`, tirage désigné compris. L'édition en dérive en le retirant.
 *
 * Il ne dérive pas de `A_CHARACTER_BUILD` : les deux formes se ressemblent sans
 * être la même chose — le contrat HTTP borne les bonus à 1 ou 2 et n'admet que
 * des tableaux mutables, là où le domaine est plus large. C'est le même écart
 * que traduit `character-build.mapper.ts`.
 */
const A_CHARACTER_BODY: CreateCharacterDto = {
  name: A_CHARACTER_NAME,
  ...A_CHARACTER_IDENTITY,
  speciesKey: 'halfling',
  lineageKey: null,
  standardLanguages: ['elvish', 'dwarvish'],
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
      languages: ['gnomish'],
      weaponMasteries: ['dagger', 'shortbow'],
    },
    {
      source: { type: 'feat', key: 'skilled' },
      skills: ['arcana', 'history', 'medicine'],
    },
  ],
  equipment: {
    armorKey: null,
    shield: false,
    items: [],
    gold: 0,
    classOptionId: 'B',
    backgroundOptionId: 'B',
  },
  abilityRollId: A_ABILITY_ROLL_ID,
};

/**
 * Le corps d'une édition : un personnage garde son tirage, il ne redésigne
 * jamais celui d'un autre.
 */
export function anEditBody(name: string = A_CHARACTER_NAME): FinalizeCharacterDto {
  return { ...A_CHARACTER_BODY, name, abilityRollId: null, expectedRevision: 1 };
}

/** Le même corps, sous le nom que le test veut donner à son personnage. */
export function aCharacterBody(name: string = A_CHARACTER_NAME): CreateCharacterDto {
  return { ...A_CHARACTER_BODY, name };
}

/**
 * Pose le tirage que `A_CHARACTER_BODY` désigne. Tout test qui crée un
 * personnage par le use-case doit l'appeler : le serveur n'accepte plus un
 * tirage qu'il n'a pas émis lui-même.
 */
export function seedAbilityRoll(
  rolls: InMemoryAbilityRollRepository,
  principalId: UserId,
  campaignId: string,
): void {
  rolls.store(A_ABILITY_ROLL_ID, principalId, campaignId, {
    dice: STANDARD_ARRAY_DICE.map((roll) => [...roll]),
  });
}
