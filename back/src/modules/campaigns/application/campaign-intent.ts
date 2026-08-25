import { createHash } from 'crypto';

const HASH_ALGORITHM = 'sha256';
const INTENTION = {
  campaignCreation: 'campaign.create',
  invitationCreation: 'campaign.invitation.create',
  invitationAcceptance: 'campaign.invitation.accept',
  invitationRefusal: 'campaign.invitation.refuse',
  invitationCancellation: 'campaign.invitation.cancel',
  memberPromotion: 'campaign.member-promote',
  memberDemotion: 'campaign.member-demote',
  memberExclusion: 'campaign.member-exclude',
  ownershipTransfer: 'campaign.ownership-transfer',
  memberDeparture: 'campaign.member-leave',
} as const;

export function hashCampaignCreation(name: string): string {
  return hash({ type: INTENTION.campaignCreation, name });
}

export function hashInvitationCreation(
  campaignId: string,
  displayName: string,
): string {
  return hash({ type: INTENTION.invitationCreation, campaignId, displayName });
}

export function hashInvitationAcceptance(campaignId: string): string {
  return hash({ type: INTENTION.invitationAcceptance, campaignId });
}

export function hashInvitationRefusal(campaignId: string): string {
  return hash({ type: INTENTION.invitationRefusal, campaignId });
}

export function hashInvitationCancellation(
  campaignId: string,
  displayName: string,
): string {
  return hash({ type: INTENTION.invitationCancellation, campaignId, displayName });
}

export function hashMemberPromotion(
  campaignId: string,
  displayName: string,
  expectedRevision: number,
): string {
  return hash({ type: INTENTION.memberPromotion, campaignId, displayName, expectedRevision });
}

export function hashMemberDemotion(
  campaignId: string,
  displayName: string,
  expectedRevision: number,
): string {
  return hash({ type: INTENTION.memberDemotion, campaignId, displayName, expectedRevision });
}

export function hashMemberExclusion(
  campaignId: string,
  displayName: string,
  expectedRevision: number,
): string {
  return hash({ type: INTENTION.memberExclusion, campaignId, displayName, expectedRevision });
}

export function hashOwnershipTransfer(
  campaignId: string,
  displayName: string,
  expectedRevision: number,
): string {
  return hash({ type: INTENTION.ownershipTransfer, campaignId, displayName, expectedRevision });
}

export function hashMemberDeparture(
  campaignId: string,
  successorDisplayName: string | null,
  expectedRevision: number,
): string {
  return hash({
    type: INTENTION.memberDeparture,
    campaignId,
    successorDisplayName,
    expectedRevision,
  });
}

function hash(intent: object): string {
  return createHash(HASH_ALGORITHM)
    .update(JSON.stringify(intent))
    .digest('hex');
}
