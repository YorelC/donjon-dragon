import { Inject, Injectable } from '@nestjs/common';
import type { CharacterAssignmentCommandResult } from '@donjon-dragon/shared/character-schema';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import { hashCharacterUnassignment } from '../character-assignment-intent';
import { toAssignmentResult } from '../character-assignment.mapper';
import { loadCampaignCharacter } from '../character.lookup';
import {
  CHARACTER_ASSIGNMENT_REPOSITORY,
  type CharacterAssignmentRepositoryPort,
  type CharacterAssignmentReceipt,
} from '../ports/character-assignment.repository.port';
import { CHARACTER_DIRECTORY, type CharacterDirectoryPort } from '../ports/character-directory.port';
import { CHARACTER_REPOSITORY, type CharacterRepositoryPort } from '../ports/character.repository.port';
import {
  CharacterAssignmentCommandConflictError,
  CharacterNotFoundError,
  OnlyGameMasterCanAssignError,
} from '../../domain/character.errors';

export interface UnassignCharacterDto {
  characterId: string;
  campaignId: string;
  actorId: ActorId;
  expectedRevision: number;
  idempotencyKey: string;
}

@Injectable()
export class UnassignCharacterUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY) private readonly characters: CharacterRepositoryPort,
    @Inject(CHARACTER_ASSIGNMENT_REPOSITORY)
    private readonly assignments: CharacterAssignmentRepositoryPort,
    @Inject(CHARACTER_DIRECTORY) private readonly directory: CharacterDirectoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: UnassignCharacterDto): Promise<CharacterAssignmentCommandResult> {
    const principalId = UserId.create(dto.actorId);
    const intentHash = hashCharacterUnassignment(
      dto.campaignId, dto.characterId, dto.expectedRevision,
    );
    const replay = await this.assignments.findReceipt(principalId, dto.idempotencyKey);
    if (replay) return acceptedResult(replay, intentHash);
    await this.assertActorIsGameMaster(dto);
    const character = await loadCampaignCharacter(
      this.characters, dto.campaignId, dto.characterId,
    );
    character.assertRevision(dto.expectedRevision);
    const occurredAt = this.clock.now();
    character.unassign(true, occurredAt);
    return this.persist(dto, principalId, intentHash, character, occurredAt);
  }

  private async assertActorIsGameMaster(dto: UnassignCharacterDto): Promise<void> {
    const role = await this.membership.execute({ campaignId: dto.campaignId, userId: dto.actorId });
    if (!role.isActiveMember) throw new CharacterNotFoundError();
    if (!role.isGameMaster) throw new OnlyGameMasterCanAssignError();
  }

  private async persist(
    dto: UnassignCharacterDto,
    principalId: UserId,
    intentHash: string,
    character: import('../../domain/character').Character,
    occurredAt: Date,
  ): Promise<CharacterAssignmentCommandResult> {
    const result = await toAssignmentResult(this.directory, character, null);
    const receipt = await this.assignments.execute({
      campaignId: dto.campaignId, principalId, idempotencyKey: dto.idempotencyKey,
      intentHash, occurredAt, effectiveRole: 'gameMaster', character,
      previousCharacter: null, facts: ['character.unassigned'], result,
    });
    return acceptedResult(receipt, intentHash);
  }
}

function acceptedResult(
  receipt: CharacterAssignmentReceipt,
  intentHash: string,
): CharacterAssignmentCommandResult {
  if (receipt.intentHash !== intentHash || !receipt.result) {
    throw new CharacterAssignmentCommandConflictError();
  }
  return receipt.result;
}
