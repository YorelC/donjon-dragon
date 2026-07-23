import type { EmailVerificationTokenRecord } from '@donjon-dragon/shared/auth-schema';

import type { EmailVerificationTokenRepositoryPort } from '../../03-domain/email/email-verification-token.repository.port';

export class InMemoryEmailVerificationTokenRepository
  implements EmailVerificationTokenRepositoryPort
{
  private readonly records = new Map<string, EmailVerificationTokenRecord>();

  async save(
    record: EmailVerificationTokenRecord,
  ): Promise<EmailVerificationTokenRecord> {
    this.records.set(record.id, record);
    return record;
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<EmailVerificationTokenRecord | null> {
    return (
      [...this.records.values()].find((r) => r.tokenHash === tokenHash) ?? null
    );
  }

  async deleteById(id: string): Promise<void> {
    this.records.delete(id);
  }
}
