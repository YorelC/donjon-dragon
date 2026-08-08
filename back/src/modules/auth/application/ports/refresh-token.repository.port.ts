import type { RefreshTokenRecord } from '@donjon-dragon/shared/auth-schema';

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface RefreshTokenRepositoryPort {
  save(record: RefreshTokenRecord): Promise<RefreshTokenRecord>;
  findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revokeById(id: string): Promise<void>;
  revokeFamily(familyId: string): Promise<void>;
}
