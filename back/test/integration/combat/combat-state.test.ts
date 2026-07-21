// ============================================================
// back/test/integration/combat/combat-state.test.ts
// Tests — InMemoryCombatStateAdapter
// ============================================================
// RED: ces tests échouent car l'adapter n'existe pas
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';

import { InMemoryCombatStateAdapter } from '../../../src/combat/infrastructure/in-memory-combat-state.adapter.js';
import type { CombatState, CombatLogEntry } from '@donjon-dragon/shared/combat-schema.js';

describe('InMemoryCombatStateAdapter', () => {
  let adapter: InMemoryCombatStateAdapter;

  const mockState = (overrides: Partial<CombatState> = {}): CombatState => ({
    id: 'combat-1',
    roomId: 'room-1',
    participants: [],
    turnOrder: [],
    currentTurnIndex: 0,
    round: 1,
    status: 'active',
    log: [],
    ...overrides,
  });

  beforeEach(() => {
    adapter = new InMemoryCombatStateAdapter();
  });

  describe('save() / get()', () => {
    it('sauvegarde et récupère un état', async () => {
      const state = mockState();
      await adapter.save('combat-1', state);
      const retrieved = await adapter.get('combat-1');
      expect(retrieved).toEqual(state);
    });

    it('get() retourne null si inexistant', async () => {
      const result = await adapter.get('unknown');
      expect(result).toBeNull();
    });

    it('écrase un état existant', async () => {
      await adapter.save('combat-1', mockState({ round: 1 }));
      await adapter.save('combat-1', mockState({ round: 3 }));
      const retrieved = await adapter.get('combat-1');
      expect(retrieved?.round).toBe(3);
    });
  });

  describe('delete()', () => {
    it('supprime un état existant', async () => {
      await adapter.save('combat-1', mockState());
      await adapter.delete('combat-1');
      const result = await adapter.get('combat-1');
      expect(result).toBeNull();
    });

    it('ne lance pas d\'erreur si inexistant', async () => {
      await expect(adapter.delete('unknown')).resolves.toBeUndefined();
    });
  });

  describe('addLogEntry()', () => {
    it('ajoute une entrée au log du combat', async () => {
      await adapter.save('combat-1', mockState());
      const entry: CombatLogEntry = {
        turn: 1,
        round: 1,
        actorId: 'hero',
        action: 'attack',
        result: 'Hit for 8 damage',
        timestamp: '2026-07-19T12:00:00.000Z',
      };
      await adapter.addLogEntry('combat-1', entry);
      const state = await adapter.get('combat-1');
      expect(state?.log).toHaveLength(1);
      expect(state?.log[0]).toEqual(entry);
    });

    it('lance une erreur si le combat n\'existe pas', async () => {
      await expect(
        adapter.addLogEntry('unknown', {} as CombatLogEntry),
      ).rejects.toThrow();
    });
  });
});