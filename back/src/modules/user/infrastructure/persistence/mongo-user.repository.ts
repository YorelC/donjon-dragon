import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { UserId } from '@kernel/domain/user-id';

import type { UserRepositoryPort, UserSearchPage } from '../../application/ports/user-repository.port';
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

  async findManyByIds(ids: UserId[]): Promise<User[]> {
    const docs = await this.model
      .find({ id: { $in: ids.map((id) => id.value) } })
      .select('-_id')
      .lean<UserDocument[]>();

    return docs.map(toDomain);
  }

  async findByEmail(email: Email): Promise<User | null> {
    return this.findOne({ email: email.value });
  }

  async findByDisplayName(displayName: DisplayName): Promise<User | null> {
    return this.findOne({ displayName: displayName.value });
  }

  async searchByDisplayName(query: string, page: number, limit: number): Promise<UserSearchPage> {
    const skip = (page - 1) * limit;
    const docs = await this.model
      .find({ displayName: { $regex: escapeRegex(query), $options: 'i' } })
      // displayName est unique : trier dessus garantit un ordre total, condition
      // nécessaire pour que skip/limit ne se chevauchent ni ne trouent entre deux pages.
      .sort({ displayName: 1 })
      .skip(skip)
      .limit(limit + 1) // +1 pour détecter hasMore sans requête count() séparée
      .select('-_id')
      .lean<UserDocument[]>();

    const hasMore = docs.length > limit;
    return { items: docs.slice(0, limit).map(toDomain), hasMore };
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
