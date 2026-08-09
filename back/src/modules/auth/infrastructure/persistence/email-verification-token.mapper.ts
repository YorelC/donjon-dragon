import { EmailVerificationToken } from '../../domain/email/email-verification-token';
import type { EmailVerificationTokenSnapshot } from '../../domain/email/email-verification-token';

/** Même raison que pour les refresh tokens : le TTL Mongo exige une Date. */
export type EmailVerificationTokenDocument = Omit<
  EmailVerificationTokenSnapshot,
  'expiresAt'
> & { expiresAt: Date };

export function toDomain(
  document: EmailVerificationTokenDocument,
): EmailVerificationToken {
  return EmailVerificationToken.restore({
    ...document,
    expiresAt: document.expiresAt.toISOString(),
  });
}

export function toPersistence(
  token: EmailVerificationToken,
): EmailVerificationTokenDocument {
  const snapshot = token.snapshot();
  return { ...snapshot, expiresAt: new Date(snapshot.expiresAt) };
}
