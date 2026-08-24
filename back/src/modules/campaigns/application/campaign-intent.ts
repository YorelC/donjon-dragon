import { createHash } from 'crypto';

const HASH_ALGORITHM = 'sha256';
const INTENTION = {
  campaignCreation: 'campaign.create',
  invitationCreation: 'campaign.invitation.create',
  invitationAcceptance: 'campaign.invitation.accept',
  invitationRefusal: 'campaign.invitation.refuse',
  invitationCancellation: 'campaign.invitation.cancel',
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

function hash(intent: object): string {
  return createHash(HASH_ALGORITHM)
    .update(JSON.stringify(intent))
    .digest('hex');
}
