import type { UserId } from '@kernel/domain/user-id';

import type { Character } from '../../domain/character';
import type { CharacterId } from '../../domain/character-id';
import type { OwningCampaignId } from '../../domain/owning-campaign-id';

export const CHARACTER_REPOSITORY = Symbol('CHARACTER_REPOSITORY');

/**
 * Le port parle l'agrégat, pas le document. `findByCampaignId` ne filtre pas
 * sur l'appelant : les use-cases décident qui voit quoi, une fois les
 * personnages chargés.
 */
export interface CharacterRepositoryPort {
  save(character: Character): Promise<void>;
  findById(id: CharacterId): Promise<Character | null>;
  findByCampaignId(campaignId: OwningCampaignId): Promise<Character[]>;
  findAssignedTo(campaignId: OwningCampaignId, playerId: UserId): Promise<Character | null>;
  deleteById(id: CharacterId): Promise<void>;
}
