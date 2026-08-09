import type { EmailVerificationToken } from '../../domain/email/email-verification-token';
import type { TokenSecret } from '../../domain/token-secret';

export const EMAIL_VERIFICATION_TOKEN_REPOSITORY = Symbol(
  'EMAIL_VERIFICATION_TOKEN_REPOSITORY',
);

export interface EmailVerificationTokenRepositoryPort {
  save(token: EmailVerificationToken): Promise<void>;
  findBySecret(secret: TokenSecret): Promise<EmailVerificationToken | null>;
  /** Usage unique : consommer le lien supprime le document (pas de flag "used"). */
  delete(token: EmailVerificationToken): Promise<void>;
}
