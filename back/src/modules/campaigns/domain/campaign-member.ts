import { UserId } from '@kernel/domain/user-id';

import { CAMPAIGN_ROLE, type CampaignRole } from './campaign-role';
import { MEMBERSHIP_STATUS, type MembershipStatus } from './membership-status';

export interface CampaignMemberSnapshot {
  userId: string;
  role: CampaignRole;
  status: MembershipStatus;
  invitedBy: string | null;
}

/**
 * Adhésion d'un utilisateur à une campagne : son rôle, l'état de son invitation
 * et qui la lui a envoyée. Immuable — une transition rend un nouveau membre
 * plutôt que de muter celui-ci, ce qui laisse à l'agrégat la responsabilité de
 * la collection.
 *
 * `invitedBy` est `null` pour le fondateur : personne ne l'a invité. Nullable et
 * non optionnel, parce que « pas d'inviteur » est un fait, pas une absence de
 * donnée. L'onglet des demandes s'en sert pour dire de quel ami vient l'invitation.
 *
 * Aucune date : rien n'en a besoin aujourd'hui, et l'ordre d'insertion du tableau
 * suffit à afficher les membres dans l'ordre où ils sont arrivés.
 */
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

  /** Un invité est toujours joueur : la promotion est une action distincte. */
  static invited(userId: UserId, invitedBy: UserId): CampaignMember {
    return new CampaignMember(
      userId,
      CAMPAIGN_ROLE.player,
      MEMBERSHIP_STATUS.pending,
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

  /** L'inviteur reste attaché au membre : c'est l'histoire de son arrivée. */
  activated(): CampaignMember {
    return new CampaignMember(
      this.userId,
      this.role,
      MEMBERSHIP_STATUS.active,
      this.invitedBy,
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

  isPending(): boolean {
    return this.status === MEMBERSHIP_STATUS.pending;
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
