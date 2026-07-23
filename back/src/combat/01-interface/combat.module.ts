import { Module } from '@nestjs/common';

import type { CombatStatePort } from '../03-domain/combat.repository.port.js';
import { InMemoryCombatStateAdapter } from '../04-infrastructure/in-memory-combat-state.adapter.js';
import { CombatGateway } from './combat.gateway';

export const COMBAT_STATE_PORT = 'COMBAT_STATE_PORT';

@Module({
  providers: [
    { provide: COMBAT_STATE_PORT, useClass: InMemoryCombatStateAdapter },
    {
      provide: CombatGateway,
      useFactory: (statePort: CombatStatePort) => new CombatGateway(statePort),
      inject: [COMBAT_STATE_PORT],
    },
  ],
})
export class CombatModule {}
