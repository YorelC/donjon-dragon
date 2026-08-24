import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import { Campaign } from '../domain/campaign';
import { CampaignName } from '../domain/campaign-name';
import { CampaignInvitation } from '../domain/campaign-invitation';

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

export function withPlayer(
  campaign: Campaign,
  gameMasterId: string,
  playerId: string,
): Campaign {
  campaign.joinFromInvitation(
    UserId.create(playerId),
    UserId.create(gameMasterId),
    TEST_INSTANT,
  );
  return campaign;
}

export function anInvitation(
  campaign: Campaign,
  gameMasterId: string,
  inviteeId: string,
): CampaignInvitation {
  return CampaignInvitation.create({
    campaignId: campaign.id,
    targetUserId: UserId.create(inviteeId),
    invitedByUserId: UserId.create(gameMasterId),
    now: TEST_INSTANT,
  });
}
