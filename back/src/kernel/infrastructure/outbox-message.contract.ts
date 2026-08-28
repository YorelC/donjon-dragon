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
