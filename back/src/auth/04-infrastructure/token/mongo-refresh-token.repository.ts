import type { Model } from 'mongoose';
import type { RefreshTokenRecord } from '@donjon-dragon/shared/auth-schema';

import type { RefreshTokenRepositoryPort } from '../../03-domain/token/refresh-token.repository.port';

export class MongoRefreshTokenRepository implements RefreshTokenRepositoryPort {
  constructor(private readonly model: Model<RefreshTokenRecord>) {}

  async save(record: RefreshTokenRecord): Promise<RefreshTokenRecord> {
    await this.model.findOneAndUpdate({ id: record.id }, record, { upsert: true });
    return record;
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const doc = await this.model.findOne({ tokenHash }).select('-_id').lean<RefreshTokenRecord>();
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
