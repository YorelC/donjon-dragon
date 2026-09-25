import { Inject, Injectable } from '@nestjs/common';
import type { CharacterReviewCommandResult } from '@donjon-dragon/shared/character-schema';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import { GetCampaignMembershipsUseCase } from '@modules/campaigns/application/use-cases/get-campaign-memberships.use-case';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import { hashCharacterReviewCommand } from '../character-command-intent';
import { acceptedReviewResult } from '../character-command-result';
import { toCharacterReviewResult } from '../character-review.mapper';
import { loadCampaignCharacter, resolveAccessContext } from '../character.lookup';
import {
  CHARACTER_COMMAND_REPOSITORY,
  type CharacterCommand,
  type CharacterCommandRepositoryPort,
} from '../ports/character-command.repository.port';
import { CHARACTER_REPOSITORY, type CharacterRepositoryPort } from '../ports/character.repository.port';
import { CharacterNotFoundError, OnlyGameMasterCanReviewError } from '../../domain/character.errors';

export interface AcceptCharacterReviewDto {
  characterId: string;
  campaignId: string;
  actorId: ActorId;
  expectedRevision: number;
  idempotencyKey: string;
}

@Injectable()
export class AcceptCharacterReviewUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY) private readonly characters: CharacterRepositoryPort,
    @Inject(CHARACTER_COMMAND_REPOSITORY)
    private readonly commands: CharacterCommandRepositoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
    private readonly memberships: GetCampaignMembershipsUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: AcceptCharacterReviewDto): Promise<CharacterReviewCommandResult> {
    const principal = UserId.create(dto.actorId);
    const intentHash = reviewIntent(dto);
    const replay = await this.commands.findReceipt(principal, dto.idempotencyKey);
    if (replay) return acceptedReviewResult(replay, intentHash);
    const command = await this.prepare(dto, principal, intentHash);
    return acceptedReviewResult(await this.commands.execute(command), intentHash);
  }

  private async prepare(
    dto: AcceptCharacterReviewDto,
    principal: UserId,
    intentHash: string,
  ): Promise<CharacterCommand> {
    await this.assertGameMaster(dto);
    const character = await loadCampaignCharacter(this.characters, dto.campaignId, dto.characterId);
    character.assertRevision(dto.expectedRevision);
    const context = await resolveAccessContext(this.memberships, {
      campaignId: dto.campaignId, actorId: dto.actorId, createdBy: character.createdBy,
    });
    const occurredAt = this.clock.now();
    character.acceptReview(context, occurredAt);
    return reviewCommand({ dto, principal, intentHash, occurredAt, character });
  }

  private async assertGameMaster(dto: AcceptCharacterReviewDto): Promise<void> {
    const role = await this.membership.execute({ campaignId: dto.campaignId, userId: dto.actorId });
    if (!role.isActiveMember) throw new CharacterNotFoundError();
    if (!role.isGameMaster) throw new OnlyGameMasterCanReviewError();
  }
}

interface AcceptedCommandInput {
  dto: AcceptCharacterReviewDto;
  principal: UserId;
  intentHash: string;
  occurredAt: Date;
  character: import('../../domain/character').Character;
}

function reviewCommand(input: AcceptedCommandInput): CharacterCommand {
  const { dto, principal, intentHash, occurredAt, character } = input;
  return {
    campaignId: dto.campaignId, principalId: principal, idempotencyKey: dto.idempotencyKey,
    intentHash, occurredAt, effectiveRole: 'gameMaster', action: 'character.accepted',
    character, result: toCharacterReviewResult(character), reason: null, buildVersion: null,
  };
}

function reviewIntent(dto: AcceptCharacterReviewDto): string {
  return hashCharacterReviewCommand({
    action: 'character.accepted', campaignId: dto.campaignId,
    characterId: dto.characterId, expectedRevision: dto.expectedRevision,
  });
}
