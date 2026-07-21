// ============================================================
// back/test/unit/character/domain/combat.test.ts
// Tests — Règles de combat D&D 5e (fonctions pures)
// ============================================================
// RED: ces tests échouent car combat.ts n'existe pas encore
// ============================================================

import { describe, it, expect } from 'vitest';

import {
  rollInitiative,
  sortByInitiative,
  buildTurnOrder,
  resolveAttack,
  applyDamage,
  rollDamage,
  nextTurn,
  isCombatOver,
  endCombat,
  type Combatant,
  type CombatState,
  type AttackRoll,
} from '../../../../src/combat/domain/combat.js';

const baseCombatant = (
  overrides: Partial<Combatant> = {},
): Combatant => ({
  id: 'char-1',
  name: 'Test Fighter',
  initiative: 0,
  armorClass: 15,
  hitPoints: { current: 30, max: 30 },
  stats: {
    strength: 16,
    dexterity: 14,
    constitution: 14,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  conditions: [],
  ...overrides,
});

describe('combat — rollInitiative()', () => {
  it('assigne un initiative ≥ 1 et ≤ 20 + mod DEX', () => {
    const combatant = baseCombatant();
    const dexMod = Math.floor((combatant.stats.dexterity - 10) / 2); // +2
    const result = rollInitiative(combatant, 15);
    expect(result.initiative).toBe(15 + dexMod);
  });
});

describe('combat — sortByInitiative()', () => {
  it('tri décroissant par initiative', () => {
    const a = baseCombatant({ id: 'a', initiative: 10 });
    const b = baseCombatant({ id: 'b', initiative: 20 });
    const c = baseCombatant({ id: 'c', initiative: 15 });
    const sorted = sortByInitiative([a, b, c]);
    expect(sorted.map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });

  it('égalité → inchangé (stabilité)', () => {
    const a = baseCombatant({ id: 'a', initiative: 15 });
    const b = baseCombatant({ id: 'b', initiative: 15 });
    const sorted = sortByInitiative([a, b]);
    expect(sorted[0].id).toBe('a');
    expect(sorted[1].id).toBe('b');
  });
});

describe('combat — buildTurnOrder()', () => {
  it('retourne les IDs triés par initiative', () => {
    const a = baseCombatant({ id: 'a', initiative: 10 });
    const b = baseCombatant({ id: 'b', initiative: 20 });
    const order = buildTurnOrder([a, b]);
    expect(order).toEqual(['b', 'a']);
  });
});

describe('combat — resolveAttack()', () => {
  it('touche quand attaque ≥ AC cible', () => {
    const attacker = baseCombatant({ id: 'attacker' });
    const target = baseCombatant({ id: 'target', armorClass: 15 });
    const roll: AttackRoll = {
      attackerId: 'attacker',
      targetId: 'target',
      attackRoll: 17, // d20 nat 15 + 2 (mod STR)
      advantage: 'none',
    };
    const result = resolveAttack(attacker, target, roll);
    expect(result.hit).toBe(true);
    expect(result.critical).toBe('none');
  });

  it('rate quand attaque < AC cible', () => {
    const attacker = baseCombatant({ id: 'attacker' });
    const target = baseCombatant({ id: 'target', armorClass: 20 });
    const roll: AttackRoll = {
      attackerId: 'attacker',
      targetId: 'target',
      attackRoll: 12,
      advantage: 'none',
    };
    const result = resolveAttack(attacker, target, roll);
    expect(result.hit).toBe(false);
    expect(result.damage).toBeUndefined();
  });

  it('critique sur attaqueRoll = 20 (avant modificateur)', () => {
    const attacker = baseCombatant({ id: 'attacker' });
    const target = baseCombatant({ id: 'target', armorClass: 30 });
    const roll: AttackRoll = {
      attackerId: 'attacker',
      targetId: 'target',
      attackRoll: 20, // naturel 20 — touche toujours
      advantage: 'none',
    };
    const result = resolveAttack(attacker, target, roll);
    expect(result.hit).toBe(true);
    expect(result.critical).toBe('success');
  });

  it('échec critique sur attaqueRoll = 1', () => {
    const attacker = baseCombatant({ id: 'attacker' });
    const target = baseCombatant({ id: 'target', armorClass: 10 });
    const roll: AttackRoll = {
      attackerId: 'attacker',
      targetId: 'target',
      attackRoll: 1, // échec automatique
      advantage: 'none',
    };
    const result = resolveAttack(attacker, target, roll);
    expect(result.hit).toBe(false);
    expect(result.critical).toBe('failure');
  });

  it('avantage → prend le meilleur des deux jets nus', () => {
    // Note : l'avantage est géré en amont dans le use-case/gateway
    // resolveAttack reçoit déjà le meilleur jet — on ne fait pas la
    // logique d'avantage ici
    const attacker = baseCombatant({ id: 'attacker' });
    const target = baseCombatant({ id: 'target', armorClass: 15 });
    const roll: AttackRoll = {
      attackerId: 'attacker',
      targetId: 'target',
      attackRoll: 18,
      advantage: 'advantage',
    };
    const result = resolveAttack(attacker, target, roll);
    // L'avantage est un flag metadata ici, pas de changement dans resolveAttack
    expect(result.hit).toBe(true);
  });
});

describe('combat — applyDamage()', () => {
  it('réduit les HP', () => {
    const target = baseCombatant();
    const damaged = applyDamage(target, 10);
    expect(damaged.hitPoints.current).toBe(20);
  });

  it('HP ne descend pas sous 0', () => {
    const target = baseCombatant({ hitPoints: { current: 5, max: 30 } });
    const damaged = applyDamage(target, 20);
    expect(damaged.hitPoints.current).toBe(0);
  });

  it('0 dégât → HP inchangés', () => {
    const target = baseCombatant();
    const damaged = applyDamage(target, 0);
    expect(damaged.hitPoints.current).toBe(30);
  });
});

describe('combat — rollDamage()', () => {
  it('roll normal (non critique) avec modificateur', () => {
    const result = rollDamage({ dice: 'd6', count: 2, modifier: 3 }, false);
    expect(result.rolls).toHaveLength(2);
    expect(result.modifier).toBe(3);
    expect(result.total).toBe(result.rawTotal + 3);
  });

  it('critique double le nombre de dés', () => {
    const result = rollDamage({ dice: 'd6', count: 2, modifier: 3 }, true);
    // Critique : 4d6 + 3
    expect(result.rolls).toHaveLength(4);
    expect(result.modifier).toBe(3);
  });
});

describe('combat — nextTurn()', () => {
  const makeState = (overrides: Partial<CombatState> = {}): CombatState => ({
    id: 'combat-1',
    roomId: 'room-1',
    participants: [
      baseCombatant({ id: 'a', initiative: 20 }),
      baseCombatant({ id: 'b', initiative: 15 }),
      baseCombatant({ id: 'c', initiative: 10 }),
    ],
    turnOrder: ['a', 'b', 'c'],
    currentTurnIndex: 0,
    round: 1,
    status: 'active',
    log: [],
    ...overrides,
  });

  it('passe à l\'index suivant', () => {
    const state = makeState();
    const next = nextTurn(state);
    expect(next.currentTurnIndex).toBe(1);
    expect(next.round).toBe(1);
  });

  it('retour au début + incrémente round si fin de tableau', () => {
    const state = makeState({ currentTurnIndex: 2 }); // dernier (index 2 = c)
    const next = nextTurn(state);
    expect(next.currentTurnIndex).toBe(0);
    expect(next.round).toBe(2);
  });
});

describe('combat — isCombatOver()', () => {
  it('retourne false si tous les participants ont HP > 0', () => {
    const state: CombatState = {
      id: 'c1',
      roomId: 'r1',
      participants: [
        baseCombatant({ id: 'a' }),
        baseCombatant({ id: 'b' }),
      ],
      turnOrder: ['a', 'b'],
      currentTurnIndex: 0,
      round: 1,
      status: 'active',
      log: [],
    };
    expect(isCombatOver(state)).toBe(false);
  });

  it('retourne true si tous les participants (sauf un camp) sont à 0 HP', () => {
    const state: CombatState = {
      id: 'c1',
      roomId: 'r1',
      participants: [
        baseCombatant({ id: 'hero', hitPoints: { current: 30, max: 30 } }),
        baseCombatant({ id: 'goblin1', hitPoints: { current: 0, max: 10 } }),
        baseCombatant({ id: 'goblin2', hitPoints: { current: 0, max: 10 } }),
      ],
      turnOrder: ['hero', 'goblin1', 'goblin2'],
      currentTurnIndex: 0,
      round: 1,
      status: 'active',
      log: [],
    };
    expect(isCombatOver(state)).toBe(true);
  });
});

describe('combat — endCombat()', () => {
  it('passe le status à completed', () => {
    const state: CombatState = {
      id: 'c1',
      roomId: 'r1',
      participants: [baseCombatant()],
      turnOrder: ['char-1'],
      currentTurnIndex: 0,
      round: 3,
      status: 'active',
      log: [],
    };
    const ended = endCombat(state);
    expect(ended.status).toBe('completed');
  });
});