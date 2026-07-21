// ============================================================
// back/test/combat/combat.gateway.test.ts
// Tests — Combat WebSocket Gateway
// ============================================================
// RED: ces tests échouent car combat.gateway.ts n'existe pas
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { CombatGateway } from '../../src/combat/interface/combat.gateway.js';
import { InMemoryCombatStateAdapter } from '../../src/combat/infrastructure/in-memory-combat-state.adapter.js';
import type { Combatant } from '@donjon-dragon/shared/combat-schema.js';

// On ne mocke pas Socket.IO — on utilise le vrai Server en mémoire
// avec un adapter in-memory pour les tests

describe('CombatGateway', () => {
  let gateway: CombatGateway;
  let stateAdapter: InMemoryCombatStateAdapter;

  const baseCombatant = (overrides: Partial<Combatant> = {}): Combatant => ({
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
    ...overrides,
  });

  beforeEach(() => {
    stateAdapter = new InMemoryCombatStateAdapter();
    gateway = new CombatGateway(stateAdapter);
  });

  describe('handleStart()', () => {
    it('crée un CombatState avec les participants', async () => {
      const hero = baseCombatant();
      const goblin = baseCombatant({
        id: 'goblin-1',
        name: 'Goblin',
        initiative: 10,
        armorClass: 13,
        hitPoints: { current: 7, max: 7 },
        stats: {
          strength: 8, dexterity: 14, constitution: 10,
          intelligence: 8, wisdom: 8, charisma: 8,
        },
      });

      const state = await gateway.handleStart({
        roomId: 'room-1',
        participantIds: [hero, goblin],
      });

      expect(state.id).toBeDefined();
      expect(state.roomId).toBe('room-1');
      expect(state.participants).toHaveLength(2);
      expect(state.status).toBe('active');
      expect(state.round).toBe(1);
      expect(state.currentTurnIndex).toBe(0);
    });

    it('tri les participants par initiative décroissante', async () => {
      const slow = baseCombatant({ id: 'slow', initiative: 5 });
      const fast = baseCombatant({ id: 'fast', initiative: 25 });
      const mid = baseCombatant({ id: 'mid', initiative: 15 });

      const state = await gateway.handleStart({
        roomId: 'room-1',
        participantIds: [slow, fast, mid],
      });

      expect(state.turnOrder).toEqual(['fast', 'mid', 'slow']);
    });

    it('persiste le state dans l\'adapter', async () => {
      const hero = baseCombatant();
      const goblin = baseCombatant({
        id: 'g-1', name: 'Goblin', initiative: 10,
        hitPoints: { current: 7, max: 7 },
        stats: { strength: 8, dexterity: 14, constitution: 10, intelligence: 8, wisdom: 8, charisma: 8 },
      });

      const state = await gateway.handleStart({
        roomId: 'room-1',
        participantIds: [hero, goblin],
      });

      const persisted = await stateAdapter.get(state.id);
      expect(persisted).toBeDefined();
      expect(persisted?.status).toBe('active');
    });
  });

  describe('handleRoll()', () => {
    it('lance un dé et retourne DiceRollResult', async () => {
      const result = gateway.handleRoll({
        diceType: 'd20',
        count: 1,
        modifier: 0,
      });
      expect(result.rolls).toHaveLength(1);
      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.total).toBeLessThanOrEqual(20);
    });

    it('lance N dés avec modificateur', async () => {
      const result = gateway.handleRoll({
        diceType: 'd6',
        count: 3,
        modifier: 2,
      });
      expect(result.rolls).toHaveLength(3);
      expect(result.total).toBe(result.rawTotal + 2);
    });
  });

  describe('handleAttack()', () => {
    it('résout une attaque et retourne un CombatState mis à jour', async () => {
      const hero = baseCombatant();
      const goblin = baseCombatant({
        id: 'g-1', name: 'Goblin', initiative: 10,
        armorClass: 13,
        hitPoints: { current: 7, max: 7 },
        stats: { strength: 8, dexterity: 14, constitution: 10, intelligence: 8, wisdom: 8, charisma: 8 },
      });

      const state = await gateway.handleStart({
        roomId: 'room-1',
        participantIds: [hero, goblin],
      });

      const updated = await gateway.handleAttack({
        combatId: state.id,
        attackerId: 'hero',
        targetId: 'g-1',
        attackRoll: 17,
        advantage: 'none',
      });

      // Vérifie que le log contient l'attaque
      expect(updated.log.length).toBeGreaterThan(0);
      const lastLog = updated.log[updated.log.length - 1];
      expect(lastLog.actorId).toBe('hero');
      expect(lastLog.action).toBe('attack');

      // Vérifie que l'état est persisté
      const persisted = await stateAdapter.get(state.id);
      expect(persisted).toBeDefined();
    });

    it('retourne une erreur si combat inexistant', async () => {
      await expect(
        gateway.handleAttack({
          combatId: 'unknown',
          attackerId: 'hero',
          targetId: 'goblin',
          attackRoll: 15,
          advantage: 'none',
        }),
      ).rejects.toThrow(/not found/i);
    });
  });

  describe('handleNextTurn()', () => {
    it('passe au tour suivant et persist', async () => {
      const a = baseCombatant({ id: 'a', initiative: 20 });
      const b = baseCombatant({ id: 'b', initiative: 15, hitPoints: { current: 7, max: 7 } });

      const state = await gateway.handleStart({
        roomId: 'room-1',
        participantIds: [a, b],
      });

      const nextState = await gateway.handleNextTurn({ combatId: state.id });
      expect(nextState.currentTurnIndex).toBe(1);
      expect(nextState.round).toBe(1);

      const persisted = await stateAdapter.get(state.id);
      expect(persisted?.currentTurnIndex).toBe(1);
    });
  });

  describe('handleEnd()', () => {
    it('termine le combat et persist', async () => {
      const a = baseCombatant({ id: 'a' });
      const b = baseCombatant({ id: 'b', initiative: 15, hitPoints: { current: 7, max: 7 } });

      const state = await gateway.handleStart({
        roomId: 'room-1',
        participantIds: [a, b],
      });

      const ended = await gateway.handleEnd({ combatId: state.id });
      expect(ended.status).toBe('completed');

      const persisted = await stateAdapter.get(state.id);
      expect(persisted?.status).toBe('completed');
    });
  });
});
