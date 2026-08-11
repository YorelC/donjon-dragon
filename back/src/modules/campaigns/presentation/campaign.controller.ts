import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import {
  CreateCampaignSchema,
  InviteToCampaignSchema,
  LeaveCampaignSchema,
  TransferOwnershipSchema,
  type CreateCampaignDto as CreateCampaignBody,
  type InviteToCampaignDto as InviteToCampaignBody,
  type LeaveCampaignDto as LeaveCampaignBody,
  type TransferOwnershipDto as TransferOwnershipBody,
} from '@donjon-dragon/shared/campaign-schema';
import type { AuthenticatedActor } from '@kernel/domain/actor-id';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodBody } from '@common/decorators/zod-validated.decorator';
import { AcceptCampaignInvitationUseCase } from '../application/use-cases/accept-campaign-invitation.use-case';
import { CountCampaignInvitationsUseCase } from '../application/use-cases/count-campaign-invitations.use-case';
import { CreateCampaignUseCase } from '../application/use-cases/create-campaign.use-case';
import { DeleteCampaignUseCase } from '../application/use-cases/delete-campaign.use-case';
import { DemoteCampaignMemberUseCase } from '../application/use-cases/demote-campaign-member.use-case';
import { GetCampaignDetailUseCase } from '../application/use-cases/get-campaign-detail.use-case';
import { InviteToCampaignUseCase } from '../application/use-cases/invite-to-campaign.use-case';
import { LeaveCampaignUseCase } from '../application/use-cases/leave-campaign.use-case';
import { ListCampaignInvitationsUseCase } from '../application/use-cases/list-campaign-invitations.use-case';
import { ListMyCampaignsUseCase } from '../application/use-cases/list-my-campaigns.use-case';
import { PromoteCampaignMemberUseCase } from '../application/use-cases/promote-campaign-member.use-case';
import { RefuseCampaignInvitationUseCase } from '../application/use-cases/refuse-campaign-invitation.use-case';
import { RemoveCampaignMemberUseCase } from '../application/use-cases/remove-campaign-member.use-case';
import { SelfDemoteCampaignOwnerUseCase } from '../application/use-cases/self-demote-campaign-owner.use-case';
import { SelfPromoteCampaignOwnerUseCase } from '../application/use-cases/self-promote-campaign-owner.use-case';
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
    @Inject(PromoteCampaignMemberUseCase) private promote: PromoteCampaignMemberUseCase,
    @Inject(DemoteCampaignMemberUseCase) private demote: DemoteCampaignMemberUseCase,
    @Inject(RemoveCampaignMemberUseCase) private removeMember: RemoveCampaignMemberUseCase,
    @Inject(SelfPromoteCampaignOwnerUseCase) private selfPromote: SelfPromoteCampaignOwnerUseCase,
    @Inject(SelfDemoteCampaignOwnerUseCase) private selfDemote: SelfDemoteCampaignOwnerUseCase,
    @Inject(TransferCampaignOwnershipUseCase) private transferOwnership: TransferCampaignOwnershipUseCase,
    @Inject(LeaveCampaignUseCase) private leave: LeaveCampaignUseCase,
    @Inject(DeleteCampaignUseCase) private remove: DeleteCampaignUseCase,
  ) {}

  @Post()
  async createCampaign(
    @CurrentUser() user: AuthenticatedActor,
    @ZodBody(CreateCampaignSchema) body: CreateCampaignBody,
  ) {
    return this.create.execute({
      name: body.name,
      founderId: user.userId,
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
    @Param('campaignId') campaignId: string,
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
    @Param('campaignId') campaignId: string,
    @ZodBody(InviteToCampaignSchema) body: InviteToCampaignBody,
  ) {
    await this.invite.execute({
      campaignId,
      displayName: body.displayName,
      inviterId: user.userId,
    });
  }

  @HttpCode(204)
  @Post(':campaignId/invitations/accept')
  async acceptCampaignInvitation(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
  ) {
    await this.acceptInvitation.execute({
      campaignId,
      userId: user.userId,
    });
  }

  @HttpCode(204)
  @Post(':campaignId/invitations/refuse')
  async refuseCampaignInvitation(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
  ) {
    await this.refuseInvitation.execute({
      campaignId,
      userId: user.userId,
    });
  }

  @HttpCode(204)
  @Post(':campaignId/members/:displayName/promote')
  async promoteCampaignMember(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
    @Param('displayName') displayName: string,
  ) {
    await this.promote.execute({
      campaignId,
      displayName,
      actorId: user.userId,
    });
  }

  @HttpCode(204)
  @Post(':campaignId/members/:displayName/demote')
  async demoteCampaignMember(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
    @Param('displayName') displayName: string,
  ) {
    await this.demote.execute({
      campaignId,
      displayName,
      actorId: user.userId,
    });
  }

  @HttpCode(204)
  @Delete(':campaignId/members/:displayName')
  async removeCampaignMember(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
    @Param('displayName') displayName: string,
  ) {
    await this.removeMember.execute({
      campaignId,
      displayName,
      actorId: user.userId,
    });
  }

  @HttpCode(204)
  @Post(':campaignId/owner/promote')
  async selfPromoteCampaignOwner(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
  ) {
    await this.selfPromote.execute({ campaignId, actorId: user.userId });
  }

  @HttpCode(204)
  @Post(':campaignId/owner/demote')
  async selfDemoteCampaignOwner(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
  ) {
    await this.selfDemote.execute({ campaignId, actorId: user.userId });
  }

  @HttpCode(204)
  @Post(':campaignId/owner')
  async transferCampaignOwnership(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
    @ZodBody(TransferOwnershipSchema) body: TransferOwnershipBody,
  ) {
    await this.transferOwnership.execute({
      campaignId,
      displayName: body.displayName,
      actorId: user.userId,
    });
  }

  @HttpCode(204)
  @Post(':campaignId/leave')
  async leaveCampaign(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
    @ZodBody(LeaveCampaignSchema) body: LeaveCampaignBody,
  ) {
    await this.leave.execute({
      campaignId,
      successorDisplayName: body.successorDisplayName,
      actorId: user.userId,
    });
  }

  @HttpCode(204)
  @Delete(':campaignId')
  async deleteCampaign(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
  ) {
    await this.remove.execute({ campaignId, actorId: user.userId });
  }
}
