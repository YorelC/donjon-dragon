import type { EmailVerificationToken } from '../../domain/email/email-verification-token';
import type { TokenSecret } from '../../domain/token-secret';

export const EMAIL_VERIFICATION_TOKEN_REPOSITORY = Symbol(
  'EMAIL_VERIFICATION_TOKEN_REPOSITORY',
);

export interface EmailVerificationTokenRepositoryPort {
  save(token: EmailVerificationToken): Promise<void>;
  findBySecret(secret: TokenSecret): Promise<EmailVerificationToken | null>;
  /**
   * Usage unique : consommer le lien supprime le document (pas de flag "used").
   *
   * Rend `true` au seul appelant qui a effectivement supprime le document. Deux
   * requetes concurrentes gagnent la lecture, une seule gagne la suppression :
   * c'est ce booleen qui les departage, et sans lui la verification s'executait
   * deux fois pour un lien a usage unique.
   */
  consume(token: EmailVerificationToken): Promise<boolean>;
}
