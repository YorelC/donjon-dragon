import { randomUUID } from 'crypto';
import { describe, it, expect } from 'vitest';
import { CAMPAIGN_NAME_RULES } from '@donjon-dragon/shared/campaign-schema';
import { UserId } from '@kernel/domain/user-id';

import { CAMPAIGN_NAME_LENGTH } from '../domain/campaign-name';
import { aCampaign, withPlayer } from '../testing/campaign.fixture';
import { toCampaignSummary } from './campaign.mapper';

describe('bornes du nom de campagne', () => {
  it('sont les mêmes dans le domaine et dans le contrat partagé', () => {
    // Le domaine redéclare ses bornes pour ne pas dépendre du transport. Rien
    // n'empêche les deux sources de diverger : ce test est ce qui l'empêche.
    expect(CAMPAIGN_NAME_LENGTH.min).toBe(CAMPAIGN_NAME_RULES.min);
    expect(CAMPAIGN_NAME_LENGTH.max).toBe(CAMPAIGN_NAME_RULES.max);
  });
});

describe('toCampaignSummary', () => {
  const gandalfId = randomUUID();
  const frodoId = randomUUID();

  it('ne laisse fuir aucun identifiant d utilisateur', () => {
    const summary = toCampaignSummary(
      withPlayer(aCampaign(gandalfId), gandalfId, frodoId),
      UserId.create(gandalfId),
    );

    expect(JSON.stringify(summary)).not.toContain(frodoId);
    expect(JSON.stringify(summary)).not.toContain(gandalfId);
  });

  it('résume la même campagne différemment selon le lecteur', () => {
    const campaign = withPlayer(aCampaign(gandalfId), gandalfId, frodoId);

    expect(toCampaignSummary(campaign, UserId.create(gandalfId)).myRole).toBe(
      'gameMaster',
    );
    expect(toCampaignSummary(campaign, UserId.create(frodoId)).myRole).toBe('player');
  });
});
