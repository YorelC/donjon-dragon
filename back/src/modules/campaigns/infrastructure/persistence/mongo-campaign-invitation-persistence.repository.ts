import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { ClientSession, Model } from 'mongoose';
import type { UserId } from '@kernel/domain/user-id';

import type { CampaignId } from '../../domain/campaign-id';
import type { CampaignInvitation } from '../../domain/campaign-invitation';
import { CAMPAIGN_INVITATION_STATUS } from '../../domain/campaign-invitation-status';
import { CampaignInvitationRevisionConflictError } from '../../domain/campaign.errors';
import {
  invitationToDomain,
  invitationToPersistence,
} from './campaign-invitation.mapper';
import {
  CAMPAIGN_INVITATION_MODEL,
  type CampaignInvitationDocument,
} from './campaign-invitation.schema';

const REVISION_INCREMENT = 1;

@Injectable()
export class MongoCampaignInvitationPersistenceRepository {
  constructor(
    @InjectModel(CAMPAIGN_INVITATION_MODEL)
    private readonly invitations: Model<CampaignInvitationDocument>,
  ) {}

  async insert(
    invitation: CampaignInvitation,
    session: ClientSession,
  ): Promise<void> {
    await this.invitations.create([invitationToPersistence(invitation)], { session });
  }

  async update(
    invitation: CampaignInvitation,
    session: ClientSession,
  ): Promise<void> {
    const document = invitationToPersistence(invitation);
    const expectedRevision = document.revision - REVISION_INCREMENT;
    const result = await this.invitations.replaceOne(
      {
        _id: document._id,
        campaignId: document.campaignId,
        status: CAMPAIGN_INVITATION_STATUS.pending,
        revision: expectedRevision,
      },
      document,
      { session },
    );
    if (result.matchedCount !== 1) {
      throw new CampaignInvitationRevisionConflictError();
    }
  }

  async findOpen(
    campaignId: CampaignId,
    targetUserId: UserId,
  ): Promise<CampaignInvitation | null> {
    const document = await this.invitations
      .findOne(openFor(campaignId.value, targetUserId.value))
      .lean<CampaignInvitationDocument>();
    return document ? invitationToDomain(document) : null;
  }

  async listOpenForTarget(targetUserId: UserId): Promise<CampaignInvitation[]> {
    const documents = await this.invitations
      .find({ targetUserId: targetUserId.value, status: CAMPAIGN_INVITATION_STATUS.pending })
      .lean<CampaignInvitationDocument[]>();
    return documents.map(invitationToDomain);
  }

  async listOpenForCampaign(campaignId: CampaignId): Promise<CampaignInvitation[]> {
    const documents = await this.invitations
      .find({ campaignId: campaignId.value, status: CAMPAIGN_INVITATION_STATUS.pending })
      .lean<CampaignInvitationDocument[]>();
    return documents.map(invitationToDomain);
  }

  countOpenForTarget(targetUserId: UserId): Promise<number> {
    return this.invitations.countDocuments({
      targetUserId: targetUserId.value,
      status: CAMPAIGN_INVITATION_STATUS.pending,
    });
  }
}

function openFor(campaignId: string, targetUserId: string) {
  return {
    campaignId,
    targetUserId,
    status: CAMPAIGN_INVITATION_STATUS.pending,
  };
}
