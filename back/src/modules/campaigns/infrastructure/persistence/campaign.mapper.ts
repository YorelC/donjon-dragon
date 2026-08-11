import { Campaign, type CampaignSnapshot } from '../../domain/campaign';

/**
 * Le document persisté EST le snapshot de l'agrégat : aucune traduction de forme,
 * seulement un changement de monde. L'alias garde le type de la persistance
 * nommable sans laisser croire qu'un document Mongoose franchit cette couche.
 */
export type CampaignDocument = CampaignSnapshot;

export function toDomain(document: CampaignDocument): Campaign {
  return Campaign.restore(document);
}

export function toPersistence(campaign: Campaign): CampaignDocument {
  return campaign.snapshot();
}
