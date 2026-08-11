import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { FilterQuery, Model } from 'mongoose';
import type { UserId } from '@kernel/domain/user-id';

import type { CampaignRepositoryPort } from '../../application/ports/campaign.repository.port';
import type { Campaign } from '../../domain/campaign';
import type { CampaignId } from '../../domain/campaign-id';
import {
  MEMBERSHIP_STATUS,
  type MembershipStatus,
} from '../../domain/membership-status';
import { toDomain, toPersistence, type CampaignDocument } from './campaign.mapper';
import { CAMPAIGN_MODEL } from './campaign.schema';

@Injectable()
export class MongoCampaignRepository implements CampaignRepositoryPort {
  constructor(
    @InjectModel(CAMPAIGN_MODEL) private readonly model: Model<CampaignDocument>,
  ) {}

  async save(campaign: Campaign): Promise<void> {
    const document = toPersistence(campaign);
    await this.model.findOneAndUpdate({ id: document.id }, document, { upsert: true });
  }

  async findById(id: CampaignId): Promise<Campaign | null> {
    const doc = await this.model
      .findOne({ id: id.value })
      .select('-_id')
      .lean<CampaignDocument>();

    return doc ? toDomain(doc) : null;
  }

  async listActiveForUser(userId: UserId): Promise<Campaign[]> {
    return this.findMany(membership(userId, MEMBERSHIP_STATUS.active));
  }

  async listPendingForUser(userId: UserId): Promise<Campaign[]> {
    return this.findMany(membership(userId, MEMBERSHIP_STATUS.pending));
  }

  async countPendingForUser(userId: UserId): Promise<number> {
    return this.model.countDocuments(membership(userId, MEMBERSHIP_STATUS.pending));
  }

  async deleteById(id: CampaignId): Promise<void> {
    await this.model.deleteOne({ id: id.value });
  }

  private async findMany(filter: FilterQuery<CampaignDocument>): Promise<Campaign[]> {
    const docs = await this.model
      .find(filter)
      .select('-_id')
      .lean<CampaignDocument[]>();

    return docs.map(toDomain);
  }
}

/**
 * $elemMatch, et non deux clés pointées : sans lui, un utilisateur invité à une
 * campagne où quelqu'un d'AUTRE est actif satisferait un filtre
 * { 'members.userId': moi, 'members.status': 'active' }, les deux conditions
 * pouvant tomber sur deux éléments différents du tableau.
 */
function membership(
  userId: UserId,
  status: MembershipStatus,
): FilterQuery<CampaignDocument> {
  return { members: { $elemMatch: { userId: userId.value, status } } };
}
