import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import type { RefreshTokenRepositoryPort } from '../../application/ports/refresh-token.repository.port';
import type { RefreshToken } from '../../domain/token/refresh-token';
import type { TokenFamilyId } from '../../domain/token/token-family-id';
import type { TokenSecret } from '../../domain/token-secret';
import {
  toDomain,
  toPersistence,
  type RefreshTokenDocument,
} from './refresh-token.mapper';
import { REFRESH_TOKEN_MODEL } from './refresh-token.schema';

@Injectable()
export class MongoRefreshTokenRepository implements RefreshTokenRepositoryPort {
  constructor(
    @InjectModel(REFRESH_TOKEN_MODEL)
    private readonly model: Model<RefreshTokenDocument>,
  ) {}

  async save(token: RefreshToken): Promise<void> {
    const document = toPersistence(token);
    await this.model.findOneAndUpdate({ id: document.id }, document, { upsert: true });
  }

  async findBySecret(secret: TokenSecret): Promise<RefreshToken | null> {
    const doc = await this.model
      .findOne({ tokenHash: secret.hash })
      .select('-_id -expiresOn')
      .lean<RefreshTokenDocument>();

    return doc ? toDomain(doc) : null;
  }

  async revokeFamily(familyId: TokenFamilyId): Promise<void> {
    await this.model.updateMany(
      { familyId: familyId.value, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date().toISOString() } },
    );
  }
}
