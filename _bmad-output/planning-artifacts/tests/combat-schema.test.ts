// ============================================================
// back/test/unit/character/domain/combat-schema.test.ts
// Tests — Validation Zod des schémas Combat
// ============================================================
// RED: ces tests échouent car combat-schema.ts n'existe pas
// ============================================================

import { describe, it, expect } from 'vitest';

import {
  CombatStateSchema,
  AttackRollSchema,
  CombatantSchema,
  CombatLogEntrySchema,
} from '@donjon-dragon/shared/combat-schema.js';

describe('CombatantSchema', () => {
  const validCombatant = {
    id: 'char-1',
    name: 'Goblin',
    initiative: 15,
    armorClass: 13,
    hitPoints: { current: 7, max: 7 },
    stats: {
      strength: 8,
      dexterity: 14,
      constitution: 10,
      intelligence: 8,
      wisdom: 8,
      charisma: 8,
    },
    conditions: [],
  };

  it('accepte un combattant valide', () => {
    const result = CombatantSchema.safeParse(validCombatant);
    expect(result.success).toBe(true);
  });

  it('rejette HP négatif', () => {
    const result = CombatantSchema.safeParse({
      ...validCombatant,
      hitPoints: { current: -1, max: 7 },
    });
    expect(result.success).toBe(false);
  });

  it('rejette current > max', () => {
    const result = CombatantSchema.safeParse({
      ...validCombatant,
      hitPoints: { current: 10, max: 7 },
    });
    expect(result.success).toBe(false);
  });

  it('rejette une condition inconnue', () => {
    const result = CombatantSchema.safeParse({
      ...validCombatant,
      conditions: ['unknown-condition'],
    });
    expect(result.success).toBe(false);
  });
});

describe('AttackRollSchema', () => {
  it('accepte un attack roll valide', () => {
    const result = AttackRollSchema.safeParse({
      attackerId: 'char-1',
      targetId: 'char-2',
      attackRoll: 17,
      advantage: 'none',
    });
    expect(result.success).toBe(true);
  });

  it('accepte avantage/disadvantage', () => {
    const adv = AttackRollSchema.safeParse({
      attackerId: 'a', targetId: 'b', attackRoll: 15, advantage: 'advantage',
    });
    const disadv = AttackRollSchema.safeParse({
      attackerId: 'a', targetId: 'b', attackRoll: 5, advantage: 'disadvantage',
    });
    expect(adv.success).toBe(true);
    expect(disadv.success).toBe(true);
  });

  it('rejette attackRoll hors bornes [1, 30]', () => {
    const low = AttackRollSchema.safeParse({
      attackerId: 'a', targetId: 'b', attackRoll: 0, advantage: 'none',
    });
    const high = AttackRollSchema.safeParse({
      attackerId: 'a', targetId: 'b', attackRoll: 31, advantage: 'none',
    });
    expect(low.success).toBe(false);
    expect(high.success).toBe(false);
  });
});

describe('CombatStateSchema', () => {
  it('accepte un état de combat valide', () => {
    const result = CombatStateSchema.safeParse({
      id: 'combat-1',
      roomId: 'room-1',
      participants: [
        {
          id: 'hero',
          name: 'Aragorn',
          initiative: 20,
          armorClass: 15,
          hitPoints: { current: 30, max: 30 },
          stats: {
            strength: 16, dexterity: 14, constitution: 14,
            intelligence: 10, wisdom: 12, charisma: 10,
          },
          conditions: [],
        },
      ],
      turnOrder: ['hero'],
      currentTurnIndex: 0,
      round: 1,
      status: 'active',
      log: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejette status invalide', () => {
    const result = CombatStateSchema.safeParse({
      id: 'c1',
      roomId: 'r1',
      participants: [],
      turnOrder: [],
      currentTurnIndex: 0,
      round: 1,
      status: 'unknown',
      log: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejette currentTurnIndex négatif', () => {
    const result = CombatStateSchema.safeParse({
      id: 'c1',
      roomId: 'r1',
      participants: [],
      turnOrder: [],
      currentTurnIndex: -1,
      round: 1,
      status: 'active',
      log: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('CombatLogEntrySchema', () => {
  it('accepte une entrée de log valide', () => {
    const result = CombatLogEntrySchema.safeParse({
      turn: 1,
      round: 1,
      actorId: 'hero',
      action: 'attack',
      result: 'Hit for 8 damage',
      timestamp: '2026-07-19T12:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });
});