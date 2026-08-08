import { EmailVerificationToken } from '../../domain/email/email-verification-token';
import type { EmailVerificationTokenSnapshot } from '../../domain/email/email-verification-token';

export type EmailVerificationTokenDocument = EmailVerificationTokenSnapshot;

export function toDomain(
  document: EmailVerificationTokenDocument,
): EmailVerificationToken {
  return EmailVerificationToken.restore(document);
}

export function toPersistence(
  token: EmailVerificationToken,
): EmailVerificationTokenDocument {
  return token.snapshot();
}
