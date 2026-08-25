import type { CampaignCommandResult } from '@donjon-dragon/shared/campaign-schema';
import type { UserId } from '@kernel/domain/user-id';

import type { Campaign } from '../domain/campaign';

interface NamedTarget {
  displayName: string;
  userId: UserId;
}

export function toCampaignCommandResult(
  campaign: Campaign,
  actorId: UserId,
  target: NamedTarget | null,
): CampaignCommandResult {
  return {
    campaignId: campaign.id.value,
    revision: campaign.revision,
    actor: memberOutcome(campaign, actorId),
    target: targetOutcome(campaign, target),
  };
}

function targetOutcome(campaign: Campaign, target: NamedTarget | null) {
  if (!target) return null;
  return { displayName: target.displayName, ...memberOutcome(campaign, target.userId) };
}

function memberOutcome(campaign: Campaign, userId: UserId) {
  const member = campaign.snapshot().members.find((item) => item.userId === userId.value);
  if (!member) {
    return { membership: 'left' as const, role: null, isOwner: false as const };
  }
  return {
    membership: 'active' as const,
    role: member.role,
    isOwner: campaign.isOwner(userId),
  };
}
