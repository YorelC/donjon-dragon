import type {
  Character as CharacterDto,
  CharacterReviewCommandResult,
} from '@donjon-dragon/shared/character-schema';
import type { UserId } from '@kernel/domain/user-id';

import type { Character, CharacterSnapshot } from '../../domain/character';

export const CHARACTER_COMMAND_REPOSITORY = Symbol('CHARACTER_COMMAND_REPOSITORY');

export type CharacterCommandAction =
  | 'character.corrected'
  | 'character.submitted'
  | 'character.accepted'
  | 'character.refused';

export type CharacterCommandResult = CharacterDto | CharacterReviewCommandResult;

export interface CharacterBuildVersionWrite {
  ordinal: number;
  contentHash: string;
  snapshot: CharacterSnapshot;
}

export interface CharacterCommand {
  campaignId: string;
  principalId: UserId;
  idempotencyKey: string;
  intentHash: string;
  occurredAt: Date;
  effectiveRole: 'gameMaster' | 'player';
  action: CharacterCommandAction;
  character: Character;
  result: CharacterCommandResult;
  reason: string | null;
  buildVersion: CharacterBuildVersionWrite | null;
}

export interface CharacterCommandReceipt {
  intentHash: string;
  result: CharacterCommandResult | null;
}

export interface CharacterCommandRepositoryPort {
  execute(command: CharacterCommand): Promise<CharacterCommandReceipt>;
  findReceipt(principalId: UserId, idempotencyKey: string): Promise<CharacterCommandReceipt | null>;
}
