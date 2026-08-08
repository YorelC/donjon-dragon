import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { RefreshTokenRecord } from '@donjon-dragon/shared/auth-schema';

import type { RefreshTokenRepositoryPort } from '../../application/ports/refresh-token.repository.port';
import {
  REFRESH_TOKEN_MODEL,
  type RefreshTokenDocument,
} from './refresh-token.schema';

@Injectable()
export class MongoRefreshTokenRepository implements RefreshTokenRepositoryPort {
  constructor(
    @InjectModel(REFRESH_TOKEN_MODEL)
    private readonly model: Model<RefreshTokenDocument>,
  ) {}

  async save(record: RefreshTokenRecord): Promise<RefreshTokenRecord> {
    // `expiresOn` est la projection Date de `expiresAt`, uniquement pour que
    // l'index TTL de la collection puisse agir (cf. refresh-token.schema.ts).
    const document = { ...record, expiresOn: new Date(record.expiresAt) };

    await this.model.findOneAndUpdate({ id: record.id }, document, { upsert: true });
    return record;
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const doc = await this.model
      .findOne({ tokenHash })
      .select('-_id -expiresOn')
      .lean<RefreshTokenRecord>();
    return doc ?? null;
  }

  async revokeById(id: string): Promise<void> {
    await this.model.updateOne({ id }, { $set: { revokedAt: new Date().toISOString() } });
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.model.updateMany(
      { familyId },
      { $set: { revokedAt: new Date().toISOString() } },
    );
  }
}
