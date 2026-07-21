import type { CombatState, Combatant } from '@donjon-dragon/shared/combat-schema';

import type { CombatStatePort } from '../domain/combat.repository.port.js';
import { buildTurnOrder } from '../domain/combat.js';

export type StartCombatPayload = {
  roomId: string;
  participantIds: Combatant[];
};

export class StartCombatUseCase {
  constructor(private readonly statePort: CombatStatePort) {}

  async execute(payload: StartCombatPayload): Promise<CombatState> {
    const state: CombatState = {
      id: crypto.randomUUID(),
      roomId: payload.roomId,
      participants: payload.participantIds,
      turnOrder: buildTurnOrder(payload.participantIds),
      currentTurnIndex: 0,
      round: 1,
      status: 'active',
      log: [],
    };

    await this.statePort.save(state.id, state);
    return state;
  }
}
