// ============================================================
// back/test/unit/character/domain/character-schema.test.ts
// Tests — Validation Zod des schémas Character
// ============================================================
// RED: ces tests échouent car character-schema.ts n'existe pas
// ============================================================

import { describe, it, expect } from 'vitest';

import {
  CreateCharacterSchema,
  CharacterSchema,
} from '@donjon-dragon/shared/character-schema.js';

describe('CreateCharacterSchema — valide', () => {
  const validPayload = {
    name: 'Aragorn',
    race: 'Human',
    class: 'Fighter',
    level: 1,
    stats: {
      strength: 15,
      dexterity: 14,
      constitution: 14,
      intelligence: 10,
      wisdom: 12,
      charisma: 10,
    },
  };

  it('accepte un payload valide complet', () => {
    const result = CreateCharacterSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('accepte sans level (default 1)', () => {
    const { level, ...noLevel } = validPayload;
    const result = CreateCharacterSchema.safeParse(noLevel);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.level).toBe(1);
    }
  });

  it('accepte un nom avec accent', () => {
    const result = CreateCharacterSchema.safeParse({
      ...validPayload,
      name: 'Frédéric',
    });
    expect(result.success).toBe(true);
  });

  it('accepte un nom avec apostrophe', () => {
    const result = CreateCharacterSchema.safeParse({
      ...validPayload,
      name: "Drizzt Do'Urden",
    });
    expect(result.success).toBe(true);
  });
});

describe('CreateCharacterSchema — invalide', () => {
  it('rejette nom vide', () => {
    const result = CreateCharacterSchema.safeParse({
      name: '',
      race: 'Human',
      class: 'Fighter',
      stats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejette nom trop long (> 50)', () => {
    const result = CreateCharacterSchema.safeParse({
      name: 'A'.repeat(51),
      race: 'Human',
      class: 'Fighter',
      stats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejette race inexistante', () => {
    const result = CreateCharacterSchema.safeParse({
      name: 'Test',
      race: 'Dragon',
      class: 'Fighter',
      stats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejette classe inexistante', () => {
    const result = CreateCharacterSchema.safeParse({
      name: 'Test',
      race: 'Human',
      class: 'Necromancer',
      stats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejette stats hors bornes (force = 1)', () => {
    const result = CreateCharacterSchema.safeParse({
      name: 'Test',
      race: 'Human',
      class: 'Fighter',
      stats: {
        strength: 1,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejette stats hors bornes (force = 25)', () => {
    const result = CreateCharacterSchema.safeParse({
      name: 'Test',
      race: 'Human',
      class: 'Fighter',
      stats: {
        strength: 25,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejette level hors bornes (0)', () => {
    const result = CreateCharacterSchema.safeParse({
      name: 'Test',
      race: 'Human',
      class: 'Fighter',
      level: 0,
      stats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejette level > 20', () => {
    const result = CreateCharacterSchema.safeParse({
      name: 'Test',
      race: 'Human',
      class: 'Fighter',
      level: 21,
      stats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejette stats manquantes', () => {
    const result = CreateCharacterSchema.safeParse({
      name: 'Test',
      race: 'Human',
      class: 'Fighter',
      stats: {
        strength: 10,
        dexterity: 10,
        // constitution manquante
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
    });
    expect(result.success).toBe(false);
  });
});

describe('CharacterSchema — valide', () => {
  it('accepte un character complet avec id et metadata', () => {
    const result = CharacterSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Gandalf',
      race: 'Human',
      class: 'Wizard',
      level: 5,
      stats: {
        strength: 10,
        dexterity: 14,
        constitution: 14,
        intelligence: 18,
        wisdom: 16,
        charisma: 14,
      },
      hitPoints: 32,
      armorClass: 12,
      proficiencyBonus: 3,
      equipment: ['quarterstaff'],
      spells: ['fire-bolt', 'magic-missile'],
      userId: 'user-1',
      createdAt: '2026-07-19T12:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejette un UUID invalide', () => {
    const result = CharacterSchema.safeParse({
      id: 'not-a-uuid',
      name: 'Test',
      race: 'Human',
      class: 'Fighter',
      level: 1,
      stats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      hitPoints: 10,
      armorClass: 10,
      proficiencyBonus: 2,
      equipment: [],
      spells: [],
      userId: 'user-1',
      createdAt: '2026-07-19T12:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });
});