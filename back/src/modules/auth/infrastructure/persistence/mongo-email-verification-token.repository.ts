import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import type { EmailVerificationTokenRepositoryPort } from '../../application/ports/email-verification-token.repository.port';
import type { EmailVerificationToken } from '../../domain/email/email-verification-token';
import type { TokenSecret } from '../../domain/token-secret';
import {
  toDomain,
  toPersistence,
  type EmailVerificationTokenDocument,
} from './email-verification-token.mapper';
import { EMAIL_VERIFICATION_TOKEN_MODEL } from './email-verification-token.schema';

@Injectable()
export class MongoEmailVerificationTokenRepository
  implements EmailVerificationTokenRepositoryPort
{
  constructor(
    @InjectModel(EMAIL_VERIFICATION_TOKEN_MODEL)
    private readonly model: Model<EmailVerificationTokenDocument>,
  ) {}

  async save(token: EmailVerificationToken): Promise<void> {
    const document = toPersistence(token);
    await this.model.findOneAndUpdate({ id: document.id }, document, { upsert: true });
  }

  async findBySecret(secret: TokenSecret): Promise<EmailVerificationToken | null> {
    const doc = await this.model
      .findOne({ tokenHash: secret.hash })
      .select('-_id')
      .lean<EmailVerificationTokenDocument>();

    return doc ? toDomain(doc) : null;
  }

  async consume(token: EmailVerificationToken): Promise<boolean> {
    const result = await this.model.deleteOne({ id: token.id });
    return result.deletedCount === 1;
  }
}
