import { UserId } from '@kernel/domain/user-id';

import type { CampaignDirectoryPort } from './ports/campaign-directory.port';
import type { CampaignRepositoryPort } from './ports/campaign.repository.port';
import type { Campaign } from '../domain/campaign';
import { CampaignId } from '../domain/campaign-id';
import { CampaignNotFoundError, MemberNotFoundError } from '../domain/campaign.errors';

/**
 * Les deux lectures que fait tout use-case du module avant d'agir. Elles vivent
 * ici plutôt que recopiées sept fois : ce sont des recherches, pas des décisions,
 * et le jour où « introuvable » se traduit autrement, il n'y a qu'un endroit.
 *
 * Le port arrive en paramètre : ces fonctions n'ont pas de dépendances propres,
 * donc rien à injecter.
 */
export async function loadCampaign(
  campaignRepo: CampaignRepositoryPort,
  campaignId: string,
): Promise<Campaign> {
  const campaign = await campaignRepo.findById(CampaignId.create(campaignId));
  if (!campaign) throw new CampaignNotFoundError();

  return campaign;
}

/**
 * Le client désigne un membre par son pseudo. À n'appeler qu'APRÈS le contrôle
 * d'habilitation : dans l'autre ordre, la route dirait à un étranger si un pseudo
 * existe, et deviendrait un oracle d'annuaire.
 */
export async function resolveMemberId(
  directory: CampaignDirectoryPort,
  displayName: string,
): Promise<UserId> {
  const user = await directory.findByDisplayName(displayName);
  if (!user) throw new MemberNotFoundError();

  return UserId.create(user.id);
}
