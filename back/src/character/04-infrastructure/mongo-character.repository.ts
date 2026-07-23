import type { Model } from 'mongoose';
import type { Character } from '@donjon-dragon/shared/character-schema';

import type { CharacterRepositoryPort } from '../03-domain/character.repository.port';

export class MongoCharacterRepository implements CharacterRepositoryPort {
  constructor(private readonly model: Model<Character>) {}

  async save(character: Character): Promise<Character> {
    await this.model.findOneAndUpdate({ id: character.id }, character, { upsert: true });
    return character;
  }

  async findById(id: string): Promise<Character | null> {
    const doc = await this.model.findOne({ id }).select('-_id').lean<Character>();
    return doc ?? null;
  }

  async findAllByUserId(userId: string): Promise<Character[]> {
    return this.model.find({ userId }).select('-_id').lean<Character[]>();
  }

  async delete(id: string): Promise<void> {
    await this.model.deleteOne({ id });
  }
}
