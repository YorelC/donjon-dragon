import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { UserId } from '@kernel/domain/user-id';

import type { UserRepositoryPort } from '../../application/ports/user-repository.port';
import type { DisplayName } from '../../domain/display-name';
import type { Email } from '../../domain/email';
import type { User } from '../../domain/user';
import { toDomain, toPersistence, type UserDocument } from './user.mapper';
import { USER_MODEL } from './user.schema';

@Injectable()
export class MongoUserRepository implements UserRepositoryPort {
  constructor(
    @InjectModel(USER_MODEL) private readonly model: Model<UserDocument>,
  ) {}

  async save(user: User): Promise<void> {
    const document = toPersistence(user);
    await this.model.findOneAndUpdate({ id: document.id }, document, { upsert: true });
  }

  async findById(id: UserId): Promise<User | null> {
    return this.findOne({ id: id.value });
  }

  async findByEmail(email: Email): Promise<User | null> {
    return this.findOne({ email: email.value });
  }

  async findByDisplayName(displayName: DisplayName): Promise<User | null> {
    return this.findOne({ displayName: displayName.value });
  }

  async searchByDisplayName(query: string, limit: number): Promise<User[]> {
    const docs = await this.model
      .find({ displayName: { $regex: escapeRegex(query), $options: 'i' } })
      .limit(limit)
      .select('-_id')
      .lean<UserDocument[]>();

    return docs.map(toDomain);
  }

  private async findOne(filter: Record<string, unknown>): Promise<User | null> {
    const doc = await this.model.findOne(filter).select('-_id').lean<UserDocument>();
    return doc ? toDomain(doc) : null;
  }
}

// Empêche l'injection de méta-caractères regex dans la recherche user.
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
