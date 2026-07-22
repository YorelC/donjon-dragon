import type { RefreshTokenRecord } from '@donjon-dragon/shared/auth-schema';

import type { RefreshTokenRepositoryPort } from '../domain/refresh-token.repository.port';

export class InMemoryRefreshTokenRepository implements RefreshTokenRepositoryPort {
  private readonly records = new Map<string, RefreshTokenRecord>();

  async save(record: RefreshTokenRecord): Promise<RefreshTokenRecord> {
    this.records.set(record.id, record);
    return record;
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return [...this.records.values()].find((r) => r.tokenHash === tokenHash) ?? null;
  }

  async revokeById(id: string): Promise<void> {
    const record = this.records.get(id);
    if (record) this.records.set(id, { ...record, revokedAt: new Date().toISOString() });
  }

  async revokeFamily(familyId: string): Promise<void> {
    for (const [id, record] of this.records) {
      if (record.familyId === familyId) {
        this.records.set(id, { ...record, revokedAt: new Date().toISOString() });
      }
    }
  }
}
