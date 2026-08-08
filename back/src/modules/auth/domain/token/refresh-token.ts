import { randomUUID } from 'crypto';
import { UserId } from '@kernel/domain/user-id';

import { TokenSecret } from '../token-secret';
import { TokenFamilyId } from './token-family-id';

export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface RefreshTokenSnapshot {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: string;
  revokedAt?: string;
  createdAt: string;
}

/**
 * Aggregate root du refresh token : un secret opaque, à usage unique, rattaché
 * à une lignée.
 *
 * Ce n'est pas un JWT — rien n'est signé. Sa validité vient de sa présence en
 * base et de son état, ce qui est précisément ce qui permet de le révoquer.
 */
export class RefreshToken {
  private constructor(
    readonly id: string,
    readonly userId: UserId,
    readonly secret: TokenSecret,
    readonly familyId: TokenFamilyId,
    readonly expiresAt: string,
    private revokedAtIso: string | undefined,
    readonly createdAt: string,
  ) {}

  /**
   * Émet un token. `familyId` absent ouvre une nouvelle lignée (connexion) ;
   * fourni, il poursuit la lignée existante (rotation).
   */
  static issue(
    userId: UserId,
    familyId?: TokenFamilyId,
  ): { token: RefreshToken; plainToken: string } {
    const { secret, plainToken } = TokenSecret.issue();
    const now = new Date();

    const token = new RefreshToken(
      randomUUID(),
      userId,
      secret,
      familyId ?? TokenFamilyId.fresh(),
      new Date(now.getTime() + REFRESH_TTL_MS).toISOString(),
      undefined,
      now.toISOString(),
    );

    return { token, plainToken };
  }

  static restore(snapshot: RefreshTokenSnapshot): RefreshToken {
    return new RefreshToken(
      snapshot.id,
      UserId.create(snapshot.userId),
      TokenSecret.fromHash(snapshot.tokenHash),
      TokenFamilyId.create(snapshot.familyId),
      snapshot.expiresAt,
      snapshot.revokedAt,
      snapshot.createdAt,
    );
  }

  get isRevoked(): boolean {
    return this.revokedAtIso !== undefined;
  }

  isExpired(now: Date): boolean {
    return new Date(this.expiresAt).getTime() < now.getTime();
  }

  belongsTo(userId: UserId): boolean {
    return this.userId.equals(userId);
  }

  /** Usage unique : consommer un token le révoque. Idempotent. */
  revoke(): void {
    this.revokedAtIso ??= new Date().toISOString();
  }

  snapshot(): RefreshTokenSnapshot {
    return {
      id: this.id,
      userId: this.userId.value,
      tokenHash: this.secret.hash,
      familyId: this.familyId.value,
      expiresAt: this.expiresAt,
      revokedAt: this.revokedAtIso,
      createdAt: this.createdAt,
    };
  }
}
