import { randomUUID } from 'crypto';
import { UserId } from '@kernel/domain/user-id';

import { TokenSecret } from '../token-secret';

export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export interface EmailVerificationTokenSnapshot {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * Aggregate root du lien de vérification d'email.
 *
 * Pas d'état `used` : la consommation supprime le document, ce qui garantit
 * l'usage unique sans avoir à maintenir un drapeau — d'où l'absence de méthode
 * de transition ici.
 */
export class EmailVerificationToken {
  private constructor(
    readonly id: string,
    readonly userId: UserId,
    readonly secret: TokenSecret,
    readonly expiresAt: string,
    readonly createdAt: string,
  ) {}

  static issue(userId: UserId): {
    token: EmailVerificationToken;
    plainToken: string;
  } {
    const { secret, plainToken } = TokenSecret.issue();
    const now = new Date();

    const token = new EmailVerificationToken(
      randomUUID(),
      userId,
      secret,
      new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS).toISOString(),
      now.toISOString(),
    );

    return { token, plainToken };
  }

  static restore(snapshot: EmailVerificationTokenSnapshot): EmailVerificationToken {
    return new EmailVerificationToken(
      snapshot.id,
      UserId.create(snapshot.userId),
      TokenSecret.fromHash(snapshot.tokenHash),
      snapshot.expiresAt,
      snapshot.createdAt,
    );
  }

  isExpired(now: Date): boolean {
    return new Date(this.expiresAt).getTime() < now.getTime();
  }

  snapshot(): EmailVerificationTokenSnapshot {
    return {
      id: this.id,
      userId: this.userId.value,
      tokenHash: this.secret.hash,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
    };
  }
}
