import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'socket.io';
import type { CombatState } from '@donjon-dragon/shared/combat-schema';

import type { CombatStatePort } from '../domain/combat.repository.port.js';
import { StartCombatUseCase, type StartCombatPayload } from '../application/start-combat.use-case.js';
import { RollDiceUseCase, type RollDicePayload, type RollDiceResult } from '../application/roll-dice.use-case.js';
import { ResolveTurnUseCase, type AttackPayload } from '../application/resolve-turn.use-case.js';

@WebSocketGateway({ namespace: 'combat' })
export class CombatGateway {
  @WebSocketServer()
  server?: Server;

  private readonly startCombatUseCase: StartCombatUseCase;
  private readonly rollDiceUseCase: RollDiceUseCase;
  private readonly resolveTurnUseCase: ResolveTurnUseCase;

  constructor(statePort: CombatStatePort) {
    this.startCombatUseCase = new StartCombatUseCase(statePort);
    this.rollDiceUseCase = new RollDiceUseCase();
    this.resolveTurnUseCase = new ResolveTurnUseCase(statePort);
  }

  @SubscribeMessage('combat:start')
  async handleStart(payload: StartCombatPayload): Promise<CombatState> {
    const state = await this.startCombatUseCase.execute(payload);
    this.server?.to(state.roomId).emit('combat:state', state);
    return state;
  }

  @SubscribeMessage('combat:roll')
  handleRoll(payload: RollDicePayload): RollDiceResult {
    return this.rollDiceUseCase.execute(payload);
  }

  @SubscribeMessage('combat:attack')
  async handleAttack(payload: AttackPayload): Promise<CombatState> {
    const state = await this.resolveTurnUseCase.attack(payload);
    this.server?.to(state.roomId).emit('combat:state', state);
    return state;
  }

  @SubscribeMessage('combat:next-turn')
  async handleNextTurn(payload: { combatId: string }): Promise<CombatState> {
    const state = await this.resolveTurnUseCase.nextTurn(payload.combatId);
    this.server?.to(state.roomId).emit('combat:state', state);
    return state;
  }

  @SubscribeMessage('combat:end')
  async handleEnd(payload: { combatId: string }): Promise<CombatState> {
    const state = await this.resolveTurnUseCase.end(payload.combatId);
    this.server?.to(state.roomId).emit('combat:state', state);
    return state;
  }
}
