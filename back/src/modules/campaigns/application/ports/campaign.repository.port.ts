import type { UserId } from '@kernel/domain/user-id';

import type { Campaign } from '../../domain/campaign';
import type { CampaignId } from '../../domain/campaign-id';

export const CAMPAIGN_REPOSITORY = Symbol('CAMPAIGN_REPOSITORY');

export interface CampaignCreationCommand {
  campaign: Campaign;
  principalId: UserId;
  idempotencyKey: string;
  intentHash: string;
  occurredAt: Date;
}

export interface CampaignCreationResult {
  campaignId: string;
  name: string;
  ownerUserId: string;
  gameMasterCount: number;
  playerCount: number;
}

export interface CampaignCreationReceipt {
  intentHash: string;
  result: CampaignCreationResult;
}

/**
 * Le port parle l'agrégat, pas le document : c'est l'adapter qui traduit.
 * `save` ne renvoie rien — l'appelant tient déjà l'instance à jour.
 *
 * `findById` charge sans recevoir l'appelant : l'application applique ensuite la
 * politique de visibilité sans mêler l'autorisation à la requête Mongo.
 */
export interface CampaignRepositoryPort {
  create(command: CampaignCreationCommand): Promise<CampaignCreationReceipt>;
  save(campaign: Campaign): Promise<void>;
  findById(id: CampaignId): Promise<Campaign | null>;

  /**
   * Une lecture pour N campagnes. Sans elle, projeter une liste d'invitations
   * relit la campagne ligne par ligne. L'ordre n'est pas garanti et une
   * campagne inconnue ou supprimee est absente du resultat.
   */
  findManyByIds(ids: CampaignId[]): Promise<Campaign[]>;
  listActiveForUser(userId: UserId): Promise<Campaign[]>;
  deleteById(id: CampaignId): Promise<void>;
}
