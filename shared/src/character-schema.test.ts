import { describe, it, expect } from 'vitest';

import {
  AbilityRollSchema,
  AbilityScoresSchema,
  FinalizeCharacterSchema,
} from './character-schema.js';

const VALID_SCORES = {
  strength: 8,
  dexterity: 16,
  constitution: 10,
  intelligence: 12,
  wisdom: 14,
  charisma: 13,
};

const A_FINALIZED_CHARACTER = {
  name: 'Frodo Sacquet',
  speciesKey: 'halfling',
  lineageKey: null,
  classKey: 'rogue',
  backgroundKey: 'charlatan',
  abilityMethod: 'roll',
  base: VALID_SCORES,
  backgroundBonuses: { dexterity: 2, charisma: 1 },
  choices: [
    {
      source: { type: 'class', key: 'rogue' },
      skills: ['acrobatics', 'insight', 'perception', 'stealth'],
      expertise: ['stealth', 'perception'],
    },
  ],
  equipment: {
    armorKey: 'leather',
    shield: false,
    items: [
      { itemKey: 'leather', quantity: 1 },
      { itemKey: 'dagger', quantity: 2 },
    ],
    gold: 8,
    classOptionId: 'A',
    backgroundOptionId: 'A',
  },
  abilityRoll: null,
};

describe('FinalizeCharacterSchema', () => {
  it('accepte une fiche complète', () => {
    expect(FinalizeCharacterSchema.safeParse(A_FINALIZED_CHARACTER).success).toBe(true);
  });

  it('refuse une espèce inconnue', () => {
    const result = FinalizeCharacterSchema.safeParse({
      ...A_FINALIZED_CHARACTER,
      speciesKey: 'hobbit',
    });

    expect(result.success).toBe(false);
  });

  it('refuse un bonus d’historique que le PHB ne prévoit pas', () => {
    const result = FinalizeCharacterSchema.safeParse({
      ...A_FINALIZED_CHARACTER,
      backgroundBonuses: { dexterity: 3 },
    });

    expect(result.success).toBe(false);
  });

  it('refuse une compétence inconnue dans un choix', () => {
    const result = FinalizeCharacterSchema.safeParse({
      ...A_FINALIZED_CHARACTER,
      choices: [{ source: { type: 'class', key: 'rogue' }, skills: ['cuisine'] }],
    });

    expect(result.success).toBe(false);
  });

  it('n’accepte que les trois méthodes de génération connues', () => {
    ['roll', 'standardArray', 'pointBuy'].forEach((abilityMethod) => {
      const result = FinalizeCharacterSchema.safeParse({
        ...A_FINALIZED_CHARACTER,
        abilityMethod,
      });

      expect(result.success).toBe(true);
    });

    const invented = FinalizeCharacterSchema.safeParse({
      ...A_FINALIZED_CHARACTER,
      abilityMethod: 'freeform',
    });

    expect(invented.success).toBe(false);
  });
});

describe('AbilityScoresSchema', () => {
  // 4d6 dont on garde les trois meilleurs ne sort jamais de [3, 18] : accepter
  // au-delà reviendrait à laisser passer un score qu'aucun tirage ne produit.
  it('borne chaque score entre 3 et 18', () => {
    expect(AbilityScoresSchema.safeParse({ ...VALID_SCORES, strength: 3 }).success).toBe(true);
    expect(AbilityScoresSchema.safeParse({ ...VALID_SCORES, strength: 18 }).success).toBe(true);
    expect(AbilityScoresSchema.safeParse({ ...VALID_SCORES, strength: 2 }).success).toBe(false);
    expect(AbilityScoresSchema.safeParse({ ...VALID_SCORES, strength: 19 }).success).toBe(false);
  });

  it('refuse une caractéristique manquante', () => {
    const { charisma: _charisma, ...incomplete } = VALID_SCORES;

    expect(AbilityScoresSchema.safeParse(incomplete).success).toBe(false);
  });
});

describe('AbilityRollSchema', () => {
  const sixRolls = [
    [6, 5, 4, 1],
    [6, 4, 4, 2],
    [5, 4, 4, 3],
    [4, 4, 4, 1],
    [4, 3, 3, 2],
    [3, 3, 2, 1],
  ];

  it('accepte six lancers de quatre d6 et leurs totaux', () => {
    const result = AbilityRollSchema.safeParse({
      dice: sixRolls,
      totals: [15, 14, 13, 12, 10, 8],
    });

    expect(result.success).toBe(true);
  });

  it('refuse un lancer qui n’a pas quatre dés', () => {
    const result = AbilityRollSchema.safeParse({
      dice: [[6, 5, 4], ...sixRolls.slice(1)],
      totals: [15, 14, 13, 12, 10, 8],
    });

    expect(result.success).toBe(false);
  });

  it('refuse une face qui n’existe pas sur un d6', () => {
    const result = AbilityRollSchema.safeParse({
      dice: [[6, 6, 6, 7], ...sixRolls.slice(1)],
      totals: [18, 14, 13, 12, 10, 8],
    });

    expect(result.success).toBe(false);
  });
});
