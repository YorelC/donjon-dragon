// ============================================================
// back/test/unit/character/domain/combat-schema.test.ts
// Tests — Schémas Zod de combat (shared)
// ============================================================
// RED: ces tests échouent car les schémas n'existent pas encore
// dans shared/src/combat-schema.ts
// ============================================================

import { describe, it, expect } from 'vitest';

import {
  DiceTypeEnum,
  ConditionEnum,
  HitPointsSchema,
  CombatantSchema,
  AttackRollSchema,
  AttackResultSchema,
  CombatLogEntrySchema,
  CombatStateSchema,
} from '@donjon-dragon/shared';

const validStats = {
  strength: 16,
  dexterity: 14,
  constitution: 14,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
};

const validCombatant = {
  id: 'char-1',
  name: 'Test Fighter',
  initiative: 15,
  armorClass: 15,
  hitPoints: { current: 30, max: 30 },
  stats: validStats,
  conditions: [],
};

describe('DiceTypeEnum', () => {
  it('accepte les dés valides', () => {
    for (const die of ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100']) {
      expect(DiceTypeEnum.safeParse(die).success).toBe(true);
    }
  });

  it('rejette un dé invalide', () => {
    expect(DiceTypeEnum.safeParse('d3').success).toBe(false);
  });
});

describe('ConditionEnum', () => {
  it('accepte une condition valide', () => {
    expect(ConditionEnum.safeParse('poisoned').success).toBe(true);
  });

  it('rejette une condition invalide', () => {
    expect(ConditionEnum.safeParse('cursed').success).toBe(false);
  });
});

describe('HitPointsSchema', () => {
  it('accepte current <= max', () => {
    expect(HitPointsSchema.safeParse({ current: 10, max: 20 }).success).toBe(true);
  });

  it('accepte current === max', () => {
    expect(HitPointsSchema.safeParse({ current: 20, max: 20 }).success).toBe(true);
  });

  it('rejette current > max', () => {
    const result = HitPointsSchema.safeParse({ current: 25, max: 20 });
    expect(result.success).toBe(false);
  });

  it('rejette current négatif', () => {
    expect(HitPointsSchema.safeParse({ current: -1, max: 20 }).success).toBe(false);
  });

  it('rejette max non positif', () => {
    expect(HitPointsSchema.safeParse({ current: 0, max: 0 }).success).toBe(false);
  });
});

describe('CombatantSchema', () => {
  it('accepte un combattant valide', () => {
    expect(CombatantSchema.safeParse(validCombatant).success).toBe(true);
  });

  it('accepte des conditions multiples', () => {
    const combatant = { ...validCombatant, conditions: ['poisoned', 'prone'] };
    expect(CombatantSchema.safeParse(combatant).success).toBe(true);
  });

  it('rejette un armorClass < 1', () => {
    const combatant = { ...validCombatant, armorClass: 0 };
    expect(CombatantSchema.safeParse(combatant).success).toBe(false);
  });

  it('rejette une condition invalide', () => {
    const combatant = { ...validCombatant, conditions: ['confused'] };
    expect(CombatantSchema.safeParse(combatant).success).toBe(false);
  });

  it('rejette des hitPoints incohérents', () => {
    const combatant = { ...validCombatant, hitPoints: { current: 40, max: 30 } };
    expect(CombatantSchema.safeParse(combatant).success).toBe(false);
  });
});

describe('AttackRollSchema', () => {
  it('accepte un jet valide', () => {
    const roll = { attackerId: 'a', targetId: 'b', attackRoll: 15, advantage: 'none' };
    expect(AttackRollSchema.safeParse(roll).success).toBe(true);
  });

  it('advantage par défaut à "none"', () => {
    const parsed = AttackRollSchema.parse({ attackerId: 'a', targetId: 'b', attackRoll: 15 });
    expect(parsed.advantage).toBe('none');
  });

  it('rejette attackRoll hors bornes (0)', () => {
    const roll = { attackerId: 'a', targetId: 'b', attackRoll: 0 };
    expect(AttackRollSchema.safeParse(roll).success).toBe(false);
  });

  it('rejette attackRoll hors bornes (31)', () => {
    const roll = { attackerId: 'a', targetId: 'b', attackRoll: 31 };
    expect(AttackRollSchema.safeParse(roll).success).toBe(false);
  });

  it('rejette une valeur advantage invalide', () => {
    const roll = { attackerId: 'a', targetId: 'b', attackRoll: 15, advantage: 'super' };
    expect(AttackRollSchema.safeParse(roll).success).toBe(false);
  });
});

describe('AttackResultSchema', () => {
  it('accepte un résultat de coup manqué (sans dégâts)', () => {
    const result = { hit: false, critical: 'none', description: 'Manqué' };
    expect(AttackResultSchema.safeParse(result).success).toBe(true);
  });

  it('accepte un résultat de coup réussi avec dégâts', () => {
    const result = {
      hit: true,
      critical: 'success',
      damage: 12,
      damageType: 'slashing',
      description: 'Touché !',
    };
    expect(AttackResultSchema.safeParse(result).success).toBe(true);
  });

  it('rejette un critical invalide', () => {
    const result = { hit: true, critical: 'maybe', description: 'Touché ?' };
    expect(AttackResultSchema.safeParse(result).success).toBe(false);
  });

  it('rejette un damage négatif', () => {
    const result = { hit: true, critical: 'none', damage: -5, description: 'Touché' };
    expect(AttackResultSchema.safeParse(result).success).toBe(false);
  });
});

describe('CombatLogEntrySchema', () => {
  it('accepte une entrée de log valide', () => {
    const entry = {
      turn: 1,
      round: 1,
      actorId: 'char-1',
      action: 'attack',
      result: 'hit',
      timestamp: new Date().toISOString(),
    };
    expect(CombatLogEntrySchema.safeParse(entry).success).toBe(true);
  });

  it('rejette un round non positif', () => {
    const entry = {
      turn: 1,
      round: 0,
      actorId: 'char-1',
      action: 'attack',
      result: 'hit',
      timestamp: new Date().toISOString(),
    };
    expect(CombatLogEntrySchema.safeParse(entry).success).toBe(false);
  });

  it('rejette un timestamp mal formé', () => {
    const entry = {
      turn: 1,
      round: 1,
      actorId: 'char-1',
      action: 'attack',
      result: 'hit',
      timestamp: 'not-a-date',
    };
    expect(CombatLogEntrySchema.safeParse(entry).success).toBe(false);
  });
});

describe('CombatStateSchema', () => {
  const validState = {
    id: 'combat-1',
    roomId: 'room-1',
    participants: [validCombatant],
    turnOrder: ['char-1'],
    currentTurnIndex: 0,
    round: 1,
    status: 'active',
    log: [],
  };

  it('accepte un état de combat valide', () => {
    expect(CombatStateSchema.safeParse(validState).success).toBe(true);
  });

  it('rejette un status invalide', () => {
    const state = { ...validState, status: 'unknown' };
    expect(CombatStateSchema.safeParse(state).success).toBe(false);
  });

  it('rejette un currentTurnIndex négatif', () => {
    const state = { ...validState, currentTurnIndex: -1 };
    expect(CombatStateSchema.safeParse(state).success).toBe(false);
  });

  it('rejette un participant invalide', () => {
    const state = { ...validState, participants: [{ ...validCombatant, armorClass: 0 }] };
    expect(CombatStateSchema.safeParse(state).success).toBe(false);
  });
});
