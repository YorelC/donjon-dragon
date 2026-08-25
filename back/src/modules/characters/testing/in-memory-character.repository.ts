import type { UserId } from '@kernel/domain/user-id';

import type { CharacterRepositoryPort } from '../application/ports/character.repository.port';
import { Character } from '../domain/character';
import type { CharacterId } from '../domain/character-id';
import type { OwningCampaignId } from '../domain/owning-campaign-id';

export class InMemoryCharacterRepository implements CharacterRepositoryPort {
  private readonly characters = new Map<string, Character>();

  async save(character: Character): Promise<void> {
    this.characters.set(character.id.value, clone(character));
  }

  async findById(id: CharacterId): Promise<Character | null> {
    const character = this.characters.get(id.value);
    return character ? clone(character) : null;
  }

  async findByCampaignId(campaignId: OwningCampaignId): Promise<Character[]> {
    return this.all().filter((character) => character.campaignId.equals(campaignId));
  }

  async findAssignedTo(
    campaignId: OwningCampaignId,
    playerId: UserId,
  ): Promise<Character | null> {
    return (
      this.all().find(
        (character) =>
          character.campaignId.equals(campaignId) &&
          !!character.assignedTo?.equals(playerId),
      ) ?? null
    );
  }

  findAssignedToInTransaction(
    campaignId: OwningCampaignId,
    playerId: UserId,
    _transactionHandle: unknown,
  ): Promise<Character | null> {
    return this.findAssignedTo(campaignId, playerId);
  }

  async saveInTransaction(
    character: Character,
    _transactionHandle: unknown,
  ): Promise<void> {
    await this.save(character);
  }

  async deleteById(id: CharacterId): Promise<void> {
    this.characters.delete(id.value);
  }

  private all(): Character[] {
    return [...this.characters.values()].map(clone);
  }
}

function clone(character: Character): Character {
  return Character.restore(character.snapshot());
}
