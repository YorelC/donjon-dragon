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
 * Les deux listes sont disjointes et le resteront : `listActiveForUser` rend les
 * campagnes dont l'utilisateur est membre actif, `listPendingForUser` celles où
 * il n'a qu'une invitation. C'est exactement la coupure des deux onglets.
 *
 * `findById` charge sans recevoir l'appelant : l'application applique ensuite la
 * politique de visibilité sans mêler l'autorisation à la requête Mongo.
 */
export interface CampaignRepositoryPort {
  create(command: CampaignCreationCommand): Promise<CampaignCreationReceipt>;
  save(campaign: Campaign): Promise<void>;
  findById(id: CampaignId): Promise<Campaign | null>;
  listActiveForUser(userId: UserId): Promise<Campaign[]>;
  listPendingForUser(userId: UserId): Promise<Campaign[]>;
  countPendingForUser(userId: UserId): Promise<number>;
  deleteById(id: CampaignId): Promise<void>;
}
