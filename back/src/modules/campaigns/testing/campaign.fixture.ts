import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import { Campaign } from '../domain/campaign';
import { CampaignName } from '../domain/campaign-name';

/**
 * Fabriques pour les tests. Elles gardent une signature en `string` : un test
 * parle d'identifiants d'utilisateurs qu'il vient de créer, pas de value objects.
 */
export const A_CAMPAIGN_NAME = 'La Malédiction de Strahd';

export function aCampaign(
  founderId: string,
  name: string = A_CAMPAIGN_NAME,
  now: Date = TEST_INSTANT,
): Campaign {
  return Campaign.create(CampaignName.create(name), UserId.create(founderId), now);
}

/** Invite puis fait accepter : mute et renvoie la même instance. */
export function withPlayer(
  campaign: Campaign,
  gameMasterId: string,
  playerId: string,
): Campaign {
  campaign.invite(UserId.create(gameMasterId), UserId.create(playerId), TEST_INSTANT);
  campaign.acceptInvitation(UserId.create(playerId), TEST_INSTANT);
  return campaign;
}

/** Invite sans faire répondre : le joueur reste en attente. */
export function withPendingInvitee(
  campaign: Campaign,
  gameMasterId: string,
  inviteeId: string,
): Campaign {
  campaign.invite(UserId.create(gameMasterId), UserId.create(inviteeId), TEST_INSTANT);
  return campaign;
}
