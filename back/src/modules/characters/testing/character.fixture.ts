import type { CharacterBuildDraft } from '../domain/character';

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
export const A_CHARACTER_BUILD: CharacterBuildDraft = {
  speciesKey: 'halfling',
  lineageKey: null,
  classKey: 'rogue',
  backgroundKey: 'charlatan',
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
