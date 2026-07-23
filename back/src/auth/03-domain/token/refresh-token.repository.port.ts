import type { RefreshTokenRecord } from '@donjon-dragon/shared/auth-schema';

export interface RefreshTokenRepositoryPort {
  save(record: RefreshTokenRecord): Promise<RefreshTokenRecord>;
  findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revokeById(id: string): Promise<void>;
  revokeFamily(familyId: string): Promise<void>;
}
