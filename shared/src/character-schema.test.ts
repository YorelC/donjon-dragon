import { describe, it, expect } from 'vitest';

import { AbilityScoresSchema, CreateCharacterSchema } from './character-schema.js';

describe('CreateCharacterSchema', () => {
  it('accepte une fiche complète', () => {
    const result = CreateCharacterSchema.safeParse({
      name: 'Frodo Sacquet',
      race: 'Hobbit',
      characterClass: 'Voleur',
      abilityScores: {
        strength: 8,
        dexterity: 16,
        constitution: 10,
        intelligence: 12,
        wisdom: 14,
        charisma: 13,
      },
    });

    expect(result.success).toBe(true);
  });

  it('refuse un nom trop court', () => {
    const result = CreateCharacterSchema.safeParse({
      name: 'F',
      race: 'Hobbit',
      characterClass: 'Voleur',
      abilityScores: {
        strength: 8,
        dexterity: 16,
        constitution: 10,
        intelligence: 12,
        wisdom: 14,
        charisma: 13,
      },
    });

    expect(result.success).toBe(false);
  });
});

describe('AbilityScoresSchema', () => {
  it('refuse une caractéristique hors bornes', () => {
    const result = AbilityScoresSchema.safeParse({
      strength: 31,
      dexterity: 16,
      constitution: 10,
      intelligence: 12,
      wisdom: 14,
      charisma: 13,
    });

    expect(result.success).toBe(false);
  });
});
