const STATUSES = ['pending', 'accepted', 'refused', 'cancelled'] as const;

export type CampaignInvitationStatus = (typeof STATUSES)[number];

export const CAMPAIGN_INVITATION_STATUS = Object.fromEntries(
  STATUSES.map((status) => [status, status]),
) as { readonly [S in CampaignInvitationStatus]: S };

export const CAMPAIGN_INVITATION_STATUSES: readonly CampaignInvitationStatus[] =
  STATUSES;
