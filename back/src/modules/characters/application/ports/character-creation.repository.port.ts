import type { Character as CharacterDto } from '@donjon-dragon/shared/character-schema';
import type { UserId } from '@kernel/domain/user-id';

import type { Character } from '../../domain/character';

export const CHARACTER_CREATION_REPOSITORY = Symbol('CHARACTER_CREATION_REPOSITORY');

export interface CharacterCreationCommand {
  campaignId: string;
  principalId: UserId;
  idempotencyKey: string;
  intentHash: string;
  occurredAt: Date;
  effectiveRole: 'gameMaster' | 'player';
  /** Le tirage émis que cette création consomme, s'il y en a un. */
  abilityRollId: string | null;
  character: Character;
  result: CharacterDto;
}

export interface CharacterCreationReceipt {
  intentHash: string;
  result: CharacterDto | null;
}

export interface CharacterCreationRepositoryPort {
  execute(command: CharacterCreationCommand): Promise<CharacterCreationReceipt>;
  findReceipt(
    principalId: UserId,
    idempotencyKey: string,
  ): Promise<CharacterCreationReceipt | null>;
}
