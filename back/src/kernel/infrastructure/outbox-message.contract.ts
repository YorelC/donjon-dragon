export const OUTBOX_AUDIENCE_POLICY = {
  targetUser: 'target-user',
  friendshipParticipants: 'friendship-participants',
  campaignMembers: 'campaign-members',
  campaignGameMasters: 'campaign-game-masters',
} as const;

export const OUTBOX_AUDIENCE_POLICY_VALUES = Object.values(
  OUTBOX_AUDIENCE_POLICY,
);

export type OutboxAudiencePolicy =
  (typeof OUTBOX_AUDIENCE_POLICY)[keyof typeof OUTBOX_AUDIENCE_POLICY];

/**
 * Le vocabulaire ferme des faits d'outbox, tous modules confondus.
 *
 * Il vit ici, avec les politiques d'audience, pour une raison precise : le
 * relais doit pouvoir declarer une projection pour CHAQUE fait, et le compilateur
 * doit refuser un fait ajoute sans projection. Un fait connu qui partirait en
 * quarantaine faute d'entree est une fonctionnalite perdue en silence.
 *
 * Ajouter un fait ici casse la compilation du relais tant qu'il n'a pas sa
 * projection. C'est voulu.
 */
export const OUTBOX_FACT_TYPE = {
  friendshipRequested: 'friendship.requested',
  friendshipAccepted: 'friendship.accepted',
  friendshipRefused: 'friendship.refused',
  friendshipRemoved: 'friendship.removed',
  campaignCreated: 'campaign.created',
  campaignMemberPromoted: 'campaign.member-promoted',
  campaignMemberDemoted: 'campaign.member-demoted',
  campaignMemberExcluded: 'campaign.member-excluded',
  campaignMemberLeft: 'campaign.member-left',
  campaignOwnershipTransferred: 'campaign.ownership-transferred',
  campaignInvitationCreated: 'campaign.invitation.created',
  campaignInvitationAccepted: 'campaign.invitation.accepted',
  campaignInvitationRefused: 'campaign.invitation.refused',
  campaignInvitationCancelled: 'campaign.invitation.cancelled',
  campaignInvitationEmailRequested: 'campaign.invitation.email-requested',
  characterAssigned: 'character.assigned',
  characterUnassigned: 'character.unassigned',
} as const;

export type OutboxFactType =
  (typeof OUTBOX_FACT_TYPE)[keyof typeof OUTBOX_FACT_TYPE];

export const OUTBOX_DELIVERY_CHANNEL = {
  realtime: 'realtime',
  email: 'email',
} as const;

export const OUTBOX_DELIVERY_CHANNEL_VALUES = Object.values(
  OUTBOX_DELIVERY_CHANNEL,
);

export type OutboxDeliveryChannel =
  (typeof OUTBOX_DELIVERY_CHANNEL)[keyof typeof OUTBOX_DELIVERY_CHANNEL];

export const OUTBOX_STATUS = {
  pending: 'pending',
  processing: 'processing',
  delivered: 'delivered',
  quarantined: 'quarantined',
} as const;

export const OUTBOX_STATUS_VALUES = Object.values(OUTBOX_STATUS);

export type OutboxStatus = (typeof OUTBOX_STATUS)[keyof typeof OUTBOX_STATUS];

export interface TargetUserAudience {
  policy: typeof OUTBOX_AUDIENCE_POLICY.targetUser;
  userIds: readonly [string];
}

export interface FriendshipParticipantsAudience {
  policy: typeof OUTBOX_AUDIENCE_POLICY.friendshipParticipants;
  userIds: readonly [string, string];
}

export interface CampaignMembersAudience {
  policy: typeof OUTBOX_AUDIENCE_POLICY.campaignMembers;
}

export interface CampaignGameMastersAudience {
  policy: typeof OUTBOX_AUDIENCE_POLICY.campaignGameMasters;
}

export type CampaignOutboxAudience =
  | TargetUserAudience
  | CampaignMembersAudience
  | CampaignGameMastersAudience;

export type UserOutboxAudience =
  | TargetUserAudience
  | FriendshipParticipantsAudience;

export type OutboxAudience = CampaignOutboxAudience | UserOutboxAudience;
