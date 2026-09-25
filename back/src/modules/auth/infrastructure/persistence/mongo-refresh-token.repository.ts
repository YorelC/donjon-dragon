import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { ClientSession, Connection, Model } from 'mongoose';

import type { RefreshTokenRepositoryPort } from '../../application/ports/refresh-token.repository.port';
import { REVOKED_BY, type RefreshToken } from '../../domain/token/refresh-token';
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
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async save(token: RefreshToken): Promise<void> {
    const document = toPersistence(token);
    await this.model.findOneAndUpdate({ id: document.id }, document, { upsert: true });
  }

  async rotate(consumed: RefreshToken, successor: RefreshToken): Promise<boolean> {
    return this.connection.transaction((session) =>
      this.rotateInTransaction(consumed, successor, session),
    );
  }

  async findBySecret(secret: TokenSecret): Promise<RefreshToken | null> {
    const doc = await this.model
      .findOne({ tokenHash: secret.hash })
      .select('-_id')
      .lean<RefreshTokenDocument>();

    return doc ? toDomain(doc) : null;
  }

  /**
   * Révocation de sécurité : elle écrase les rotations de routine, sinon un
   * token compromis conserverait sa fenêtre de tolérance.
   */
  async revokeFamily(familyId: TokenFamilyId, now: Date): Promise<void> {
    await this.model.updateMany(
      { familyId: familyId.value },
      {
        $set: {
          revokedAt: now.toISOString(),
          revokedReason: REVOKED_BY.compromised,
        },
      },
    );
  }

  private async rotateInTransaction(
    consumed: RefreshToken,
    successor: RefreshToken,
    session: ClientSession,
  ): Promise<boolean> {
    const revoked = toPersistence(consumed);
    const result = await this.model.updateOne(
      { id: revoked.id, revokedAt: { $exists: false } },
      { $set: { revokedAt: revoked.revokedAt, revokedReason: revoked.revokedReason } },
      { session },
    );
    if (result.matchedCount !== 1) return false;
    await this.model.create([toPersistence(successor)], { session });
    return true;
  }
}
