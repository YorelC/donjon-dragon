import { Inject, Injectable } from '@nestjs/common';
import type { CharacterReviewCommandResult } from '@donjon-dragon/shared/character-schema';
import { GetCampaignMembershipsUseCase } from '@modules/campaigns/application/use-cases/get-campaign-memberships.use-case';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import { hashBuildVersion, hashCharacterReviewCommand } from '../character-command-intent';
import { acceptedReviewResult } from '../character-command-result';
import { toCharacterReviewResult } from '../character-review.mapper';
import { loadCampaignCharacter, resolveAccessContext } from '../character.lookup';
import {
  CHARACTER_COMMAND_REPOSITORY,
  type CharacterCommand,
  type CharacterCommandRepositoryPort,
} from '../ports/character-command.repository.port';
import { CHARACTER_REPOSITORY, type CharacterRepositoryPort } from '../ports/character.repository.port';

export interface SubmitCharacterForReviewDto {
  characterId: string;
  campaignId: string;
  actorId: ActorId;
  expectedRevision: number;
  idempotencyKey: string;
}

@Injectable()
export class SubmitCharacterForReviewUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY) private readonly characters: CharacterRepositoryPort,
    @Inject(CHARACTER_COMMAND_REPOSITORY)
    private readonly commands: CharacterCommandRepositoryPort,
    private readonly memberships: GetCampaignMembershipsUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: SubmitCharacterForReviewDto): Promise<CharacterReviewCommandResult> {
    const principal = UserId.create(dto.actorId);
    const intentHash = reviewIntent(dto);
    const replay = await this.commands.findReceipt(principal, dto.idempotencyKey);
    if (replay) return acceptedReviewResult(replay, intentHash);
    const command = await this.prepare(dto, principal, intentHash);
    return acceptedReviewResult(await this.commands.execute(command), intentHash);
  }

  private async prepare(
    dto: SubmitCharacterForReviewDto,
    principal: UserId,
    intentHash: string,
  ): Promise<CharacterCommand> {
    const character = await loadCampaignCharacter(this.characters, dto.campaignId, dto.characterId);
    character.assertRevision(dto.expectedRevision);
    const context = await resolveAccessContext(this.memberships, {
      campaignId: dto.campaignId, actorId: dto.actorId, createdBy: character.createdBy,
    });
    const occurredAt = this.clock.now();
    const ordinal = character.submitForReview(context, occurredAt);
    const snapshot = character.snapshot();
    return {
      campaignId: dto.campaignId, principalId: principal, idempotencyKey: dto.idempotencyKey,
      intentHash, occurredAt, effectiveRole: context.actorIsGameMaster ? 'gameMaster' : 'player',
      action: 'character.submitted', character, result: toCharacterReviewResult(character),
      reason: null, buildVersion: { ordinal, snapshot, contentHash: hashBuildVersion(snapshot) },
    };
  }
}

function reviewIntent(dto: SubmitCharacterForReviewDto): string {
  return hashCharacterReviewCommand({
    action: 'character.submitted', campaignId: dto.campaignId,
    characterId: dto.characterId, expectedRevision: dto.expectedRevision,
  });
}
