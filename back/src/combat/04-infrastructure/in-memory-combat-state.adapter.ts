import type { CombatState, CombatLogEntry } from '@donjon-dragon/shared/combat-schema';

import type { CombatStatePort } from '../03-domain/combat.repository.port';

export class InMemoryCombatStateAdapter implements CombatStatePort {
  private readonly states = new Map<string, CombatState>();

  async get(combatId: string): Promise<CombatState | null> {
    return this.states.get(combatId) ?? null;
  }

  async save(combatId: string, state: CombatState): Promise<void> {
    this.states.set(combatId, state);
  }

  async delete(combatId: string): Promise<void> {
    this.states.delete(combatId);
  }

  async addLogEntry(combatId: string, entry: CombatLogEntry): Promise<void> {
    const state = this.states.get(combatId);
    if (!state) {
      throw new Error(`Combat not found: ${combatId}`);
    }
    state.log.push(entry);
  }
}
