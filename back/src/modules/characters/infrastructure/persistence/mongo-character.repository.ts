import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { ClientSession, Model } from 'mongoose';
import type { UserId } from '@kernel/domain/user-id';

import type { CharacterRepositoryPort } from '../../application/ports/character.repository.port';
import type { Character } from '../../domain/character';
import type { CharacterId } from '../../domain/character-id';
import type { OwningCampaignId } from '../../domain/owning-campaign-id';
import { CharacterRevisionConflictError } from '../../domain/character.errors';
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

  async findByCampaignAndId(
    campaignId: OwningCampaignId,
    id: CharacterId,
  ): Promise<Character | null> {
    const doc = await this.model
      .findOne({ id: id.value, campaignId: campaignId.value })
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

  async findAssignedToInTransaction(
    campaignId: OwningCampaignId,
    playerId: UserId,
    transactionHandle: unknown,
  ): Promise<Character | null> {
    const doc = await this.model
      .findOne({ campaignId: campaignId.value, assignedTo: playerId.value })
      .session(mongoSession(transactionHandle))
      .select('-_id')
      .lean<CharacterDocument>();
    return doc ? toDomain(doc) : null;
  }

  async saveInTransaction(
    character: Character,
    transactionHandle: unknown,
  ): Promise<void> {
    const document = toPersistence(character);
    const expectedRevision = character.revision - REVISION_INCREMENT;
    const result = await this.model.replaceOne(
      { id: character.id.value, revision: expectedRevision },
      document,
      { session: mongoSession(transactionHandle) },
    );
    if (result.matchedCount !== 1) throw new CharacterRevisionConflictError();
  }

  async deleteById(id: CharacterId): Promise<void> {
    await this.model.deleteOne({ id: id.value });
  }
}

const REVISION_INCREMENT = 1;

function mongoSession(handle: unknown): ClientSession {
  return handle as ClientSession;
}
