import type { Model } from 'mongoose';
import type { User } from '@donjon-dragon/shared/user-schema';

import type { UserRepositoryPort } from '../03-domain/user.repository.port';

export class MongoUserRepository implements UserRepositoryPort {
  constructor(private readonly model: Model<User>) {}

  async save(user: User): Promise<User> {
    await this.model.findOneAndUpdate({ id: user.id }, user, { upsert: true });
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.model.findOne({ id }).select('-_id').lean<User>();
    return doc ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.model.findOne({ email }).select('-_id').lean<User>();
    return doc ?? null;
  }

  async findByDisplayName(displayName: string): Promise<User | null> {
    const doc = await this.model.findOne({ displayName }).select('-_id').lean<User>();
    return doc ?? null;
  }

  async searchByDisplayName(query: string, limit: number): Promise<User[]> {
    return this.model
      .find({ displayName: { $regex: escapeRegex(query), $options: 'i' } })
      .limit(limit)
      .select('-_id')
      .lean<User[]>();
  }
}

// Empêche l'injection de méta-caractères regex dans la recherche user.
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
