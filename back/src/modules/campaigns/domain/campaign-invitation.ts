import { randomUUID } from 'crypto';
import { UserId } from '@kernel/domain/user-id';

import { CampaignId } from './campaign-id';
import { CampaignInvitationId } from './campaign-invitation-id';
import {
  CAMPAIGN_INVITATION_STATUS,
  type CampaignInvitationStatus,
} from './campaign-invitation-status';
import { NoPendingCampaignInvitationError } from './campaign.errors';

export interface CampaignInvitationSnapshot {
  id: string;
  campaignId: string;
  targetUserId: string;
  invitedByUserId: string;
  status: CampaignInvitationStatus;
  revision: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

interface CampaignInvitationCreation {
  campaignId: CampaignId;
  targetUserId: UserId;
  invitedByUserId: UserId;
  now: Date;
}

interface CampaignInvitationState {
  id: CampaignInvitationId;
  campaignId: CampaignId;
  targetUserId: UserId;
  invitedByUserId: UserId;
  status: CampaignInvitationStatus;
  revision: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export class CampaignInvitation {
  private constructor(private readonly state: CampaignInvitationState) {}

  static create(creation: CampaignInvitationCreation): CampaignInvitation {
    const { campaignId, targetUserId, invitedByUserId, now } = creation;
    const createdAt = now.toISOString();
    return new CampaignInvitation({
      id: CampaignInvitationId.create(randomUUID()),
      campaignId,
      targetUserId,
      invitedByUserId,
      status: CAMPAIGN_INVITATION_STATUS.pending,
      revision: INITIAL_REVISION,
      createdAt,
      updatedAt: createdAt,
      closedAt: null,
    });
  }

  static restore(snapshot: CampaignInvitationSnapshot): CampaignInvitation {
    return new CampaignInvitation({
      id: CampaignInvitationId.create(snapshot.id),
      campaignId: CampaignId.create(snapshot.campaignId),
      targetUserId: UserId.create(snapshot.targetUserId),
      invitedByUserId: UserId.create(snapshot.invitedByUserId),
      status: snapshot.status,
      revision: snapshot.revision,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
      closedAt: snapshot.closedAt,
    });
  }

  get id(): CampaignInvitationId {
    return this.state.id;
  }

  get campaignId(): CampaignId {
    return this.state.campaignId;
  }

  get targetUserId(): UserId {
    return this.state.targetUserId;
  }

  get invitedByUserId(): UserId {
    return this.state.invitedByUserId;
  }

  get createdAt(): string {
    return this.state.createdAt;
  }

  get status(): CampaignInvitationStatus {
    return this.state.status;
  }

  get revision(): number {
    return this.state.revision;
  }

  get updatedAt(): string {
    return this.state.updatedAt;
  }

  get closedAt(): string | null {
    return this.state.closedAt;
  }

  accept(actorId: UserId, now: Date): void {
    this.assertTarget(actorId);
    this.close(CAMPAIGN_INVITATION_STATUS.accepted, now);
  }

  refuse(actorId: UserId, now: Date): void {
    this.assertTarget(actorId);
    this.close(CAMPAIGN_INVITATION_STATUS.refused, now);
  }

  cancel(now: Date): void {
    this.close(CAMPAIGN_INVITATION_STATUS.cancelled, now);
  }

  isPending(): boolean {
    return this.state.status === CAMPAIGN_INVITATION_STATUS.pending;
  }

  snapshot(): CampaignInvitationSnapshot {
    return {
      id: this.id.value,
      campaignId: this.campaignId.value,
      targetUserId: this.targetUserId.value,
      invitedByUserId: this.invitedByUserId.value,
      status: this.state.status,
      revision: this.state.revision,
      createdAt: this.createdAt,
      updatedAt: this.state.updatedAt,
      closedAt: this.state.closedAt,
    };
  }

  private assertTarget(actorId: UserId): void {
    if (!this.targetUserId.equals(actorId)) {
      throw new NoPendingCampaignInvitationError();
    }
  }

  private close(status: CampaignInvitationStatus, now: Date): void {
    if (!this.isPending()) throw new NoPendingCampaignInvitationError();
    const closedAt = now.toISOString();
    this.state.status = status;
    this.state.revision += REVISION_INCREMENT;
    this.state.updatedAt = closedAt;
    this.state.closedAt = closedAt;
  }
}

const INITIAL_REVISION = 0;
const REVISION_INCREMENT = 1;
