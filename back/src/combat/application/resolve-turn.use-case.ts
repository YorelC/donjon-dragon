import { NotFoundException } from '@nestjs/common';
import type { CombatState, CombatLogEntry, Combatant } from '@donjon-dragon/shared/combat-schema';

import type { CombatStatePort } from '../domain/combat.repository.port.js';
import { resolveAttack, applyDamage, rollDamage, nextTurn, endCombat } from '../domain/combat.js';

export type AttackPayload = {
  combatId: string;
  attackerId: string;
  targetId: string;
  attackRoll: number;
  advantage: 'none' | 'advantage' | 'disadvantage';
};

const DEFAULT_DAMAGE = { die: 'd6' as const, count: 1, modifier: 0 };

export class ResolveTurnUseCase {
  constructor(private readonly statePort: CombatStatePort) {}

  async attack(payload: AttackPayload): Promise<CombatState> {
    const state = await this.getOrThrow(payload.combatId);
    const attacker = this.findCombatant(state, payload.attackerId);
    const target = this.findCombatant(state, payload.targetId);

    const result = resolveAttack(attacker, target, payload);
    const participants = result.hit
      ? this.applyDamageToTarget(state.participants, target.id, result.critical === 'success')
      : state.participants;

    const entry: CombatLogEntry = {
      turn: state.currentTurnIndex,
      round: state.round,
      actorId: payload.attackerId,
      action: 'attack',
      result: result.description,
      timestamp: new Date().toISOString(),
    };

    const updated: CombatState = { ...state, participants, log: [...state.log, entry] };
    await this.statePort.save(payload.combatId, updated);
    return updated;
  }

  async nextTurn(combatId: string): Promise<CombatState> {
    const updated = nextTurn(await this.getOrThrow(combatId));
    await this.statePort.save(combatId, updated);
    return updated;
  }

  async end(combatId: string): Promise<CombatState> {
    const updated = endCombat(await this.getOrThrow(combatId));
    await this.statePort.save(combatId, updated);
    return updated;
  }

  private applyDamageToTarget(participants: Combatant[], targetId: string, critical: boolean): Combatant[] {
    const damage = rollDamage(DEFAULT_DAMAGE, critical).total;
    return participants.map((c) => (c.id === targetId ? applyDamage(c, damage) : c));
  }

  private async getOrThrow(combatId: string): Promise<CombatState> {
    const state = await this.statePort.get(combatId);
    if (!state) throw new NotFoundException(`Combat not found: ${combatId}`);
    return state;
  }

  private findCombatant(state: CombatState, id: string): Combatant {
    const combatant = state.participants.find((c) => c.id === id);
    if (!combatant) throw new NotFoundException(`Combatant not found: ${id}`);
    return combatant;
  }
}
