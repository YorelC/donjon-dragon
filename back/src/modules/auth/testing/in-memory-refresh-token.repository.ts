import type { RefreshTokenRepositoryPort } from '../application/ports/refresh-token.repository.port';
import { REVOKED_BY, type RefreshToken } from '../domain/token/refresh-token';
import type { TokenFamilyId } from '../domain/token/token-family-id';
import type { TokenSecret } from '../domain/token-secret';

export class InMemoryRefreshTokenRepository implements RefreshTokenRepositoryPort {
  private readonly tokens = new Map<string, RefreshToken>();

  async save(token: RefreshToken): Promise<void> {
    this.tokens.set(token.id, token);
  }

  async findBySecret(secret: TokenSecret): Promise<RefreshToken | null> {
    return this.all().find((token) => token.secret.equals(secret)) ?? null;
  }

  async revokeFamily(familyId: TokenFamilyId, now: Date): Promise<void> {
    for (const token of this.all()) {
      if (token.familyId.equals(familyId)) token.revoke(now, REVOKED_BY.compromised);
    }
  }

  all(): RefreshToken[] {
    return [...this.tokens.values()];
  }
}
