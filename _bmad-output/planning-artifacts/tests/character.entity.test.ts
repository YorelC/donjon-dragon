// ============================================================
// back/test/unit/character/domain/character.entity.test.ts
// Tests — Entité personnage et fonctions de calcul
// ============================================================
// RED: ces tests échouent car character.entity.ts n'existe pas
// ============================================================

import { describe, it, expect } from 'vitest';

import {
  calculateModifier,
  calculateHitPoints,
  calculateProficiencyBonus,
  calculateArmorClass,
  createCharacter,
  type CreateCharacterParams,
} from '../../../../src/character/domain/character.entity.js';

describe('character.entity — calculateModifier()', () => {
  it('10 → 0', () => expect(calculateModifier(10)).toBe(0));
  it('14 → 2', () => expect(calculateModifier(14)).toBe(2));
  it('20 → 5', () => expect(calculateModifier(20)).toBe(5));
  it('8 → -1', () => expect(calculateModifier(8)).toBe(-1));
  it('3 → -4', () => expect(calculateModifier(3)).toBe(-4));
  it('1 → -5 (edge case)', () => expect(calculateModifier(1)).toBe(-5));
  it('30 → 10 (edge case)', () => expect(calculateModifier(30)).toBe(10));
});

describe('character.entity — calculateHitPoints()', () => {
  it('Fighter level 1, CON 14 → 12 + 2 = 14', () => {
    const hp = calculateHitPoints('Fighter', 14, 1);
    expect(hp).toBe(14); // 12 (d12) + 2 (CON mod)
  });

  it('Wizard level 1, CON 10 → 6', () => {
    const hp = calculateHitPoints('Wizard', 10, 1);
    expect(hp).toBe(6); // 6 (d6) + 0
  });

  it('Wizard level 3, CON 10 → 6 + 4 + 4 = 14', () => {
    // niveau 1 : 6, niveau 2+ : 4 par niveau
    const hp = calculateHitPoints('Wizard', 10, 3);
    expect(hp).toBe(14); // 6 + 4 + 4
  });

  it('Barbarian level 1, CON 16 → 12 + 3 = 15', () => {
    const hp = calculateHitPoints('Barbarian', 16, 1);
    expect(hp).toBe(15);
  });
});

describe('character.entity — calculateProficiencyBonus()', () => {
  it('level 1 → 2', () => expect(calculateProficiencyBonus(1)).toBe(2));
  it('level 5 → 3', () => expect(calculateProficiencyBonus(5)).toBe(3));
  it('level 9 → 4', () => expect(calculateProficiencyBonus(9)).toBe(4));
  it('level 13 → 5', () => expect(calculateProficiencyBonus(13)).toBe(5));
  it('level 17 → 6', () => expect(calculateProficiencyBonus(17)).toBe(6));
  it('level 20 → 6', () => expect(calculateProficiencyBonus(20)).toBe(6));
});

describe('character.entity — calculateArmorClass()', () => {
  it('base 10 + DEX mod', () => {
    const ac = calculateArmorClass(14); // DEX 14 = +2
    expect(ac).toBe(12); // 10 + 2
  });

  it('DEX 8 → 9', () => {
    const ac = calculateArmorClass(8); // DEX 8 = -1
    expect(ac).toBe(9); // 10 + (-1)
  });
});

describe('character.entity — createCharacter()', () => {
  const validParams: CreateCharacterParams = {
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
    userId: 'user-1',
  };

  it('crée un personnage avec tous les champs calculés', () => {
    const char = createCharacter(validParams);
    expect(char).toHaveProperty('id');
    expect(char.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(char.name).toBe('Aragorn');
    expect(char.race).toBe('Human');
    expect(char.class).toBe('Fighter');
    expect(char.level).toBe(1);
  });

  it('calcule les HP correctement', () => {
    const char = createCharacter(validParams);
    // Fighter d12, CON 14 (+2) → 12 + 2 = 14
    expect(char.hitPoints.max).toBe(14);
    expect(char.hitPoints.current).toBe(14);
  });

  it('calcule l\'armor class', () => {
    const char = createCharacter(validParams);
    // DEX 14 → +2 → AC = 12
    expect(char.armorClass).toBe(12);
  });

  it('calcule le proficiency bonus', () => {
    const char = createCharacter(validParams);
    expect(char.proficiencyBonus).toBe(2);
  });

  it('génère un createdAt ISO', () => {
    const char = createCharacter(validParams);
    expect(char.createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    );
  });

  it('initialise equipment et spells à empty', () => {
    const char = createCharacter(validParams);
    expect(char.equipment).toEqual([]);
    expect(char.spells).toEqual([]);
  });

  it('level > 1 calcule les HP pour chaque niveau', () => {
    const highLevel = createCharacter({ ...validParams, level: 5 });
    // Fighter: 12 + 4*6 + CON mod * 5 = 12 + 24 + 10 = 46... non:
    // niveau 1: 12 + 2 = 14
    // niveaux 2-5: 6 + 2 = 8 par niveau → 4 * 8 = 32
    // total: 14 + 32 = 46
    expect(highLevel.hitPoints.max).toBe(46);
  });
});