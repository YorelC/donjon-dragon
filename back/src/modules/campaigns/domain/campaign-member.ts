import { UserId } from '@kernel/domain/user-id';

import { CAMPAIGN_ROLE, type CampaignRole } from './campaign-role';
import { MEMBERSHIP_STATUS, type MembershipStatus } from './membership-status';

export interface CampaignMemberSnapshot {
  userId: string;
  role: CampaignRole;
  status: MembershipStatus;
  invitedBy: string | null;
}

export class CampaignMember {
  private constructor(
    readonly userId: UserId,
    readonly role: CampaignRole,
    readonly status: MembershipStatus,
    readonly invitedBy: UserId | null,
  ) {}

  /** Le créateur d'une campagne en est maître du jeu, et actif immédiatement. */
  static founder(userId: UserId): CampaignMember {
    return new CampaignMember(
      userId,
      CAMPAIGN_ROLE.gameMaster,
      MEMBERSHIP_STATUS.active,
      null,
    );
  }

  static joined(userId: UserId, invitedBy: UserId): CampaignMember {
    return new CampaignMember(
      userId,
      CAMPAIGN_ROLE.player,
      MEMBERSHIP_STATUS.active,
      invitedBy,
    );
  }

  static restore(snapshot: CampaignMemberSnapshot): CampaignMember {
    return new CampaignMember(
      UserId.create(snapshot.userId),
      snapshot.role,
      snapshot.status,
      snapshot.invitedBy ? UserId.create(snapshot.invitedBy) : null,
    );
  }

  withRole(role: CampaignRole): CampaignMember {
    return new CampaignMember(this.userId, role, this.status, this.invitedBy);
  }

  is(userId: UserId): boolean {
    return this.userId.equals(userId);
  }

  isGameMaster(): boolean {
    return this.role === CAMPAIGN_ROLE.gameMaster;
  }

  isActive(): boolean {
    return this.status === MEMBERSHIP_STATUS.active;
  }

  snapshot(): CampaignMemberSnapshot {
    return {
      userId: this.userId.value,
      role: this.role,
      status: this.status,
      invitedBy: this.invitedBy?.value ?? null,
    };
  }
}
