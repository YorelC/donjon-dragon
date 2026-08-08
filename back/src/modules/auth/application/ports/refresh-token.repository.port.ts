import type { RefreshToken } from '../../domain/token/refresh-token';
import type { TokenFamilyId } from '../../domain/token/token-family-id';
import type { TokenSecret } from '../../domain/token-secret';

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface RefreshTokenRepositoryPort {
  save(token: RefreshToken): Promise<void>;

  /** On cherche par empreinte : le secret en clair ne descend jamais ici. */
  findBySecret(secret: TokenSecret): Promise<RefreshToken | null>;

  /**
   * Révoque la lignée entière. Seule opération qui reste au repository plutôt
   * qu'à l'agrégat : elle porte sur plusieurs agrégats à la fois.
   */
  revokeFamily(familyId: TokenFamilyId): Promise<void>;
}
