import { Controller, Delete, HttpCode, Inject, Post } from '@nestjs/common';
import {
  CampaignIdSchema,
  CampaignRoleCommandSchema,
  IDEMPOTENCY_KEY_HEADER,
  IdempotencyKeySchema,
  LeaveCampaignSchema,
  type CampaignRoleCommandDto,
  type LeaveCampaignDto,
} from '@donjon-dragon/shared/campaign-schema';
import { displayNameField } from '@donjon-dragon/shared/user-schema';
import type { AuthenticatedActor } from '@kernel/domain/actor-id';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodBody, ZodHeader, ZodParam } from '@common/decorators/zod-validated.decorator';
import { LeaveCampaignWithCharacterUseCase } from '../application/use-cases/leave-campaign-with-character.use-case';
import { ExcludeCampaignMemberWithCharacterUseCase } from '../application/use-cases/exclude-campaign-member-with-character.use-case';
import { PromoteCampaignMemberWithCharacterUseCase } from '../application/use-cases/promote-campaign-member-with-character.use-case';

@Controller('campaigns')
export class CampaignCharacterLifecycleController {
  constructor(
    @Inject(PromoteCampaignMemberWithCharacterUseCase)
    private readonly promote: PromoteCampaignMemberWithCharacterUseCase,
    @Inject(LeaveCampaignWithCharacterUseCase)
    private readonly leave: LeaveCampaignWithCharacterUseCase,
    @Inject(ExcludeCampaignMemberWithCharacterUseCase)
    private readonly exclude: ExcludeCampaignMemberWithCharacterUseCase,
  ) {}

  @HttpCode(200)
  @Post(':campaignId/members/:displayName/promote')
  promoteMember(
    @CurrentUser() actor: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodParam('displayName', displayNameField()) displayName: string,
    @ZodBody(CampaignRoleCommandSchema) body: CampaignRoleCommandDto,
    @ZodHeader(IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema) idempotencyKey: string,
  ) {
    return this.promote.execute({
      campaignId,
      displayName,
      expectedRevision: body.expectedRevision,
      actorId: actor.userId,
      idempotencyKey,
    });
  }

  @HttpCode(200)
  @Delete(':campaignId/members/:displayName')
  excludeMember(
    @CurrentUser() actor: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodParam('displayName', displayNameField()) displayName: string,
    @ZodBody(CampaignRoleCommandSchema) body: CampaignRoleCommandDto,
    @ZodHeader(IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema) idempotencyKey: string,
  ) {
    return this.exclude.execute({
      campaignId,
      displayName,
      expectedRevision: body.expectedRevision,
      actorId: actor.userId,
      idempotencyKey,
    });
  }

  @HttpCode(200)
  @Post(':campaignId/leave')
  leaveCampaign(
    @CurrentUser() actor: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodBody(LeaveCampaignSchema) body: LeaveCampaignDto,
    @ZodHeader(IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema) idempotencyKey: string,
  ) {
    return this.leave.execute({
      campaignId,
      successorDisplayName: body.successorDisplayName,
      expectedRevision: body.expectedRevision,
      actorId: actor.userId,
      idempotencyKey,
    });
  }
}
