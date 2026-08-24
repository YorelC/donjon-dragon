import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { ClientSession, Connection, Model } from 'mongoose';
import type { UserId } from '@kernel/domain/user-id';

import { CampaignRevisionConflictError } from '../../domain/campaign.errors';
import type { Campaign } from '../../domain/campaign';
import type { CampaignId } from '../../domain/campaign-id';
import type { MembershipStatus } from '../../domain/membership-status';
import { toDomain, toPersistence } from './campaign.mapper';
import {
  CAMPAIGN_MEMBERSHIP_MODEL,
  type CampaignMembershipDocument,
} from './campaign-membership.schema';
import { CAMPAIGN_MODEL, type CampaignDocument } from './campaign.schema';

const INITIAL_REVISION = 0;
const REVISION_INCREMENT = 1;

@Injectable()
export class MongoCampaignPersistenceRepository {
  constructor(
    @InjectModel(CAMPAIGN_MODEL) private readonly roots: Model<CampaignDocument>,
    @InjectModel(CAMPAIGN_MEMBERSHIP_MODEL)
    private readonly memberships: Model<CampaignMembershipDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  transaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
    return this.connection.transaction(work);
  }

  async save(campaign: Campaign, session: ClientSession): Promise<void> {
    const persisted = toPersistence(campaign);
    await this.saveRoot(persisted.root, session);
    await this.replaceMemberships(persisted.memberships, campaign.id.value, session);
  }

  async findById(id: CampaignId): Promise<Campaign | null> {
    const root = await this.roots.findOne(activeRoot(id.value)).lean<CampaignDocument>();
    if (!root) return null;

    return this.hydrate(root);
  }

  async listForUser(userId: UserId, status: MembershipStatus): Promise<Campaign[]> {
    const memberships = await this.memberships
      .find({ userId: userId.value, status })
      .lean<CampaignMembershipDocument[]>();
    return this.findMany(memberships.map((membership) => membership.campaignId));
  }

  countForUser(userId: UserId, status: MembershipStatus): Promise<number> {
    return this.memberships.countDocuments({ userId: userId.value, status });
  }

  async deleteById(id: CampaignId): Promise<void> {
    await this.transaction(async (session) => {
      await this.roots.deleteOne({ _id: id.value }, { session });
      await this.memberships.deleteMany({ campaignId: id.value }, { session });
    });
  }

  private async saveRoot(root: CampaignDocument, session: ClientSession): Promise<void> {
    if (root.revision === INITIAL_REVISION) {
      await this.roots.create([root], { session });
      return;
    }

    const expected = root.revision - REVISION_INCREMENT;
    const result = await this.roots.replaceOne({ _id: root._id, revision: expected }, root, {
      session,
    });
    if (result.matchedCount !== 1) throw new CampaignRevisionConflictError();
  }

  private async replaceMemberships(
    documents: CampaignMembershipDocument[],
    campaignId: string,
    session: ClientSession,
  ): Promise<void> {
    await this.memberships.deleteMany({ campaignId }, { session });
    if (documents.length > 0) await this.memberships.insertMany(documents, { session });
  }

  private async findMany(campaignIds: string[]): Promise<Campaign[]> {
    if (campaignIds.length === 0) return [];
    const roots = await this.roots
      .find({ _id: { $in: campaignIds }, deletedAt: null })
      .lean<CampaignDocument[]>();
    return Promise.all(roots.map((root) => this.hydrate(root)));
  }

  private async hydrate(root: CampaignDocument): Promise<Campaign> {
    const memberships = await this.memberships
      .find({ campaignId: root._id })
      .lean<CampaignMembershipDocument[]>();
    return toDomain(root, memberships);
  }
}

function activeRoot(campaignId: string) {
  return { _id: campaignId, deletedAt: null };
}
