import type { EmailVerificationTokenRecord } from '@donjon-dragon/shared/auth-schema';

export interface EmailVerificationTokenRepositoryPort {
  save(
    record: EmailVerificationTokenRecord,
  ): Promise<EmailVerificationTokenRecord>;
  findByTokenHash(
    tokenHash: string,
  ): Promise<EmailVerificationTokenRecord | null>;
  // Usage unique : supprimé après consommation (pas de flag "used").
  deleteById(id: string): Promise<void>;
}
