import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Post,
} from '@nestjs/common';
import {
  CampaignIdSchema,
  CampaignRoleCommandSchema,
  CreateCampaignSchema,
  IDEMPOTENCY_KEY_HEADER,
  IdempotencyKeySchema,
  InviteToCampaignSchema,
  TransferOwnershipSchema,
  type CampaignRoleCommandDto as CampaignRoleCommandBody,
  type CreateCampaignDto as CreateCampaignBody,
  type InviteToCampaignDto as InviteToCampaignBody,
  type TransferOwnershipDto as TransferOwnershipBody,
} from '@donjon-dragon/shared/campaign-schema';
import type { AuthenticatedActor } from '@kernel/domain/actor-id';
import { displayNameField } from '@donjon-dragon/shared/user-schema';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import {
  ZodBody,
  ZodHeader,
  ZodParam,
} from '@common/decorators/zod-validated.decorator';
import { AcceptCampaignInvitationUseCase } from '../application/use-cases/accept-campaign-invitation.use-case';
import { CancelCampaignInvitationUseCase } from '../application/use-cases/cancel-campaign-invitation.use-case';
import { CountCampaignInvitationsUseCase } from '../application/use-cases/count-campaign-invitations.use-case';
import { CreateCampaignUseCase } from '../application/use-cases/create-campaign.use-case';
import { DeleteCampaignUseCase } from '../application/use-cases/delete-campaign.use-case';
import { DemoteCampaignMemberUseCase } from '../application/use-cases/demote-campaign-member.use-case';
import { GetCampaignDetailUseCase } from '../application/use-cases/get-campaign-detail.use-case';
import { InviteToCampaignUseCase } from '../application/use-cases/invite-to-campaign.use-case';
import { ListCampaignInvitationsUseCase } from '../application/use-cases/list-campaign-invitations.use-case';
import { ListMyCampaignsUseCase } from '../application/use-cases/list-my-campaigns.use-case';
import { RefuseCampaignInvitationUseCase } from '../application/use-cases/refuse-campaign-invitation.use-case';
import { TransferCampaignOwnershipUseCase } from '../application/use-cases/transfer-campaign-ownership.use-case';

/**
 * Traduction HTTP seule. Les erreurs métier remontent telles quelles : le
 * DomainExceptionFilter (APP_FILTER) les convertit en statut.
 * Aucun @UseGuards : le JwtAuthGuard est monté en APP_GUARD dans app.module.
 *
 * Les routes littérales `invitations` et `invitations/count` sont déclarées AVANT
 * `:campaignId` : Nest résout dans l'ordre de déclaration, et le paramètre
 * avalerait sinon le mot. Quitter est un POST `.../leave` et non un
 * DELETE `.../members/me` pour la même raison : `me` est un pseudo valide.
 */
@Controller('campaigns')
export class CampaignController {
  // Une injection par ligne : ce sont des déclarations, et la forme sur deux
  // lignes ferait dépasser au constructeur la limite de corps de fonction.
  constructor(
    @Inject(CreateCampaignUseCase) private create: CreateCampaignUseCase,
    @Inject(ListMyCampaignsUseCase) private listMine: ListMyCampaignsUseCase,
    @Inject(ListCampaignInvitationsUseCase) private listInvitations: ListCampaignInvitationsUseCase,
    @Inject(CountCampaignInvitationsUseCase) private countInvitations: CountCampaignInvitationsUseCase,
    @Inject(GetCampaignDetailUseCase) private detail: GetCampaignDetailUseCase,
    @Inject(InviteToCampaignUseCase) private invite: InviteToCampaignUseCase,
    @Inject(AcceptCampaignInvitationUseCase) private acceptInvitation: AcceptCampaignInvitationUseCase,
    @Inject(RefuseCampaignInvitationUseCase) private refuseInvitation: RefuseCampaignInvitationUseCase,
    @Inject(CancelCampaignInvitationUseCase) private cancelInvitation: CancelCampaignInvitationUseCase,
    @Inject(DemoteCampaignMemberUseCase) private demote: DemoteCampaignMemberUseCase,
    @Inject(TransferCampaignOwnershipUseCase) private transferOwnership: TransferCampaignOwnershipUseCase,
    @Inject(DeleteCampaignUseCase) private remove: DeleteCampaignUseCase,
  ) {}

  @Post()
  async createCampaign(
    @CurrentUser() user: AuthenticatedActor,
    @ZodBody(CreateCampaignSchema) body: CreateCampaignBody,
    @ZodHeader(IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema)
    idempotencyKey: string,
  ) {
    return this.create.execute({
      name: body.name,
      founderId: user.userId,
      idempotencyKey,
    });
  }

  @Get()
  async listMyCampaigns(@CurrentUser() user: AuthenticatedActor) {
    return this.listMine.execute({ userId: user.userId });
  }

  @Get('invitations/count')
  async countCampaignInvitations(@CurrentUser() user: AuthenticatedActor) {
    return this.countInvitations.execute({ userId: user.userId });
  }

  @Get('invitations')
  async listCampaignInvitations(@CurrentUser() user: AuthenticatedActor) {
    return this.listInvitations.execute({ userId: user.userId });
  }

  @Get(':campaignId')
  async getCampaignDetail(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
  ) {
    return this.detail.execute({
      campaignId,
      userId: user.userId,
    });
  }

  @HttpCode(204)
  @Post(':campaignId/invitations')
  async inviteToCampaign(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodBody(InviteToCampaignSchema) body: InviteToCampaignBody,
    @ZodHeader(IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema)
    idempotencyKey: string,
  ) {
    await this.invite.execute({
      campaignId,
      displayName: body.displayName,
      inviterId: user.userId,
      idempotencyKey,
    });
  }

  @HttpCode(204)
  @Post(':campaignId/invitations/accept')
  async acceptCampaignInvitation(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodHeader(IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema)
    idempotencyKey: string,
  ) {
    await this.acceptInvitation.execute({
      campaignId,
      userId: user.userId,
      idempotencyKey,
    });
  }

  @HttpCode(204)
  @Post(':campaignId/invitations/refuse')
  async refuseCampaignInvitation(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodHeader(IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema)
    idempotencyKey: string,
  ) {
    await this.refuseInvitation.execute({
      campaignId,
      userId: user.userId,
      idempotencyKey,
    });
  }

  @HttpCode(204)
  @Delete(':campaignId/invitations/:displayName')
  async cancelCampaignInvitation(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodParam('displayName', displayNameField()) displayName: string,
    @ZodHeader(IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema)
    idempotencyKey: string,
  ) {
    await this.cancelInvitation.execute({
      campaignId,
      displayName,
      actorId: user.userId,
      idempotencyKey,
    });
  }

  @HttpCode(200)
  @Post(':campaignId/members/:displayName/demote')
  demoteCampaignMember(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodParam('displayName', displayNameField()) displayName: string,
    @ZodBody(CampaignRoleCommandSchema) body: CampaignRoleCommandBody,
    @ZodHeader(IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema)
    idempotencyKey: string,
  ) {
    return this.demote.execute({
      campaignId,
      displayName,
      expectedRevision: body.expectedRevision,
      actorId: user.userId,
      idempotencyKey,
    });
  }

  @HttpCode(200)
  @Post(':campaignId/owner')
  transferCampaignOwnership(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodBody(TransferOwnershipSchema) body: TransferOwnershipBody,
    @ZodHeader(IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema)
    idempotencyKey: string,
  ) {
    return this.transferOwnership.execute({
      campaignId,
      displayName: body.displayName,
      expectedRevision: body.expectedRevision,
      actorId: user.userId,
      idempotencyKey,
    });
  }

  @HttpCode(204)
  @Delete(':campaignId')
  async deleteCampaign(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
  ) {
    await this.remove.execute({ campaignId, actorId: user.userId });
  }
}
