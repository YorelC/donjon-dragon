import {
  REALTIME_RESOURCE,
  type RealtimeResource,
} from '@donjon-dragon/shared/realtime-schema';

export const CAMPAIGNS_OWNER_MODULE = 'campaigns';

/** Les faits que ce module écrit dans l'outbox. Vocabulaire fermé, et à lui. */
export const CAMPAIGN_FACT = {
  created: 'campaign.created',
  memberPromoted: 'campaign.member-promoted',
  memberDemoted: 'campaign.member-demoted',
  memberExcluded: 'campaign.member-excluded',
  memberLeft: 'campaign.member-left',
  ownershipTransferred: 'campaign.ownership-transferred',
  invitationCreated: 'campaign.invitation.created',
  invitationAccepted: 'campaign.invitation.accepted',
  invitationRefused: 'campaign.invitation.refused',
  invitationCancelled: 'campaign.invitation.cancelled',
  invitationEmailRequested: 'campaign.invitation.email-requested',
} as const;

export type CampaignFact = (typeof CAMPAIGN_FACT)[keyof typeof CAMPAIGN_FACT];

/** Un fait qui n'a rien à faire diffuser en temps réel. */
const NOT_BROADCAST = null;

/**
 * Ce que le client doit réinvalider pour chacun de ces faits.
 *
 * La projection appartient au module qui produit le fait. Le `Record` est total
 * sur le vocabulaire ci-dessus : ajouter un fait sans dire ce qu'il invalide ne
 * compile pas.
 *
 * `campaigns` et `campaign-invitations` invalident aujourd'hui le même préfixe
 * côté client. La distinction est conservée parce qu'elle porte une intention —
 * la vie de la table d'un côté, la boîte à invitations de l'autre — mais elle
 * n'a pas encore d'effet observable.
 */
export const CAMPAIGN_REALTIME_PROJECTION: Record<
  CampaignFact,
  RealtimeResource | null
> = {
  [CAMPAIGN_FACT.created]: REALTIME_RESOURCE.campaigns,
  [CAMPAIGN_FACT.memberPromoted]: REALTIME_RESOURCE.campaigns,
  [CAMPAIGN_FACT.memberDemoted]: REALTIME_RESOURCE.campaigns,
  [CAMPAIGN_FACT.memberExcluded]: REALTIME_RESOURCE.campaigns,
  [CAMPAIGN_FACT.memberLeft]: REALTIME_RESOURCE.campaigns,
  [CAMPAIGN_FACT.ownershipTransferred]: REALTIME_RESOURCE.campaigns,
  [CAMPAIGN_FACT.invitationCreated]: REALTIME_RESOURCE['campaign-invitations'],
  [CAMPAIGN_FACT.invitationCancelled]: REALTIME_RESOURCE['campaign-invitations'],
  // Acceptée et refusée ne visent pas l'invité mais la table : l'audience est
  // campaign-members pour l'une, campaign-game-masters pour l'autre.
  [CAMPAIGN_FACT.invitationAccepted]: REALTIME_RESOURCE.campaigns,
  [CAMPAIGN_FACT.invitationRefused]: REALTIME_RESOURCE.campaigns,
  // Canal `email` : jamais réclamé par le relais temps réel, donc jamais projeté.
  // L'entrée existe pour que le Record reste total, pas pour être atteinte.
  [CAMPAIGN_FACT.invitationEmailRequested]: NOT_BROADCAST,
};
