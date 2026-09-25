import type { RefreshTokenRepositoryPort } from '../application/ports/refresh-token.repository.port';
import { REVOKED_BY, RefreshToken } from '../domain/token/refresh-token';
import type { TokenFamilyId } from '../domain/token/token-family-id';
import type { TokenSecret } from '../domain/token-secret';

export class InMemoryRefreshTokenRepository implements RefreshTokenRepositoryPort {
  private readonly tokens = new Map<string, RefreshToken>();

  async save(token: RefreshToken): Promise<void> {
    this.tokens.set(token.id, clone(token));
  }

  async rotate(consumed: RefreshToken, successor: RefreshToken): Promise<boolean> {
    const current = this.tokens.get(consumed.id);
    if (!current || current.isRevoked) return false;
    this.tokens.set(consumed.id, clone(consumed));
    this.tokens.set(successor.id, clone(successor));
    return true;
  }

  async findBySecret(secret: TokenSecret): Promise<RefreshToken | null> {
    const found = this.all().find((token) => token.secret.equals(secret));
    return found ? clone(found) : null;
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

function clone(token: RefreshToken): RefreshToken {
  return RefreshToken.restore(token.snapshot());
}
