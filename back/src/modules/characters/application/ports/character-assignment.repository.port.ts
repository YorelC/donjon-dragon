import type { CharacterAssignmentCommandResult } from '@donjon-dragon/shared/character-schema';
import type { UserId } from '@kernel/domain/user-id';

import type { Character } from '../../domain/character';

export const CHARACTER_ASSIGNMENT_REPOSITORY = Symbol('CHARACTER_ASSIGNMENT_REPOSITORY');

export type CharacterAssignmentFact = 'character.assigned' | 'character.unassigned';

export interface CharacterAssignmentCommand {
  campaignId: string;
  principalId: UserId;
  idempotencyKey: string;
  intentHash: string;
  occurredAt: Date;
  effectiveRole: string;
  character: Character;
  previousCharacter: Character | null;
  facts: CharacterAssignmentFact[];
  result: CharacterAssignmentCommandResult;
}

export interface CharacterAssignmentReceipt {
  intentHash: string;
  result: CharacterAssignmentCommandResult | null;
}

export interface CharacterAssignmentRepositoryPort {
  execute(command: CharacterAssignmentCommand): Promise<CharacterAssignmentReceipt>;
  findReceipt(
    principalId: UserId,
    idempotencyKey: string,
  ): Promise<CharacterAssignmentReceipt | null>;
}
