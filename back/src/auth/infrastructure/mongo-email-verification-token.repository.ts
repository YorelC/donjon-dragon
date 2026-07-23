import type { Model } from 'mongoose';
import type { EmailVerificationTokenRecord } from '@donjon-dragon/shared/auth-schema';

import type { EmailVerificationTokenRepositoryPort } from '../domain/email-verification-token.repository.port';

export class MongoEmailVerificationTokenRepository implements EmailVerificationTokenRepositoryPort {
  constructor(private readonly model: Model<EmailVerificationTokenRecord>) {}

  async save(record: EmailVerificationTokenRecord): Promise<EmailVerificationTokenRecord> {
    await this.model.findOneAndUpdate({ id: record.id }, record, { upsert: true });
    return record;
  }

  async findByTokenHash(tokenHash: string): Promise<EmailVerificationTokenRecord | null> {
    const doc = await this.model.findOne({ tokenHash }).select('-_id').lean<EmailVerificationTokenRecord>();
    return doc ?? null;
  }

  async deleteById(id: string): Promise<void> {
    await this.model.deleteOne({ id });
  }
}
