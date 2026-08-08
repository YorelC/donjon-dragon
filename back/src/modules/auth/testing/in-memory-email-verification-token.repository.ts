import type { EmailVerificationTokenRepositoryPort } from '../application/ports/email-verification-token.repository.port';
import type { EmailVerificationToken } from '../domain/email/email-verification-token';
import type { TokenSecret } from '../domain/token-secret';

export class InMemoryEmailVerificationTokenRepository
  implements EmailVerificationTokenRepositoryPort
{
  private readonly tokens = new Map<string, EmailVerificationToken>();

  async save(token: EmailVerificationToken): Promise<void> {
    this.tokens.set(token.id, token);
  }

  async findBySecret(secret: TokenSecret): Promise<EmailVerificationToken | null> {
    return (
      [...this.tokens.values()].find((token) => token.secret.equals(secret)) ?? null
    );
  }

  async delete(token: EmailVerificationToken): Promise<void> {
    this.tokens.delete(token.id);
  }
}
