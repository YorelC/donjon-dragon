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
}
