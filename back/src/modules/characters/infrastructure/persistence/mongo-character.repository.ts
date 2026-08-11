import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { UserId } from '@kernel/domain/user-id';

import type { CharacterRepositoryPort } from '../../application/ports/character.repository.port';
import type { Character } from '../../domain/character';
import type { CharacterId } from '../../domain/character-id';
import type { OwningCampaignId } from '../../domain/owning-campaign-id';
import { toDomain, toPersistence, type CharacterDocument } from './character.mapper';
import { CHARACTER_MODEL } from './character.schema';

@Injectable()
export class MongoCharacterRepository implements CharacterRepositoryPort {
  constructor(
    @InjectModel(CHARACTER_MODEL) private readonly model: Model<CharacterDocument>,
  ) {}

  async save(character: Character): Promise<void> {
    const document = toPersistence(character);
    await this.model.findOneAndUpdate({ id: document.id }, document, { upsert: true });
  }

  async findById(id: CharacterId): Promise<Character | null> {
    const doc = await this.model
      .findOne({ id: id.value })
      .select('-_id')
      .lean<CharacterDocument>();

    return doc ? toDomain(doc) : null;
  }

  async findByCampaignId(campaignId: OwningCampaignId): Promise<Character[]> {
    const docs = await this.model
      .find({ campaignId: campaignId.value })
      .select('-_id')
      .lean<CharacterDocument[]>();

    return docs.map(toDomain);
  }

  async findAssignedTo(
    campaignId: OwningCampaignId,
    playerId: UserId,
  ): Promise<Character | null> {
    const doc = await this.model
      .findOne({ campaignId: campaignId.value, assignedTo: playerId.value })
      .select('-_id')
      .lean<CharacterDocument>();

    return doc ? toDomain(doc) : null;
  }

  async deleteById(id: CharacterId): Promise<void> {
    await this.model.deleteOne({ id: id.value });
  }
}
