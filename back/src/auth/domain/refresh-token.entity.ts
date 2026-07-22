import { createHash, randomBytes, randomUUID } from 'crypto';
import type { RefreshTokenRecord } from '@donjon-dragon/shared/auth-schema';

export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function hashRefreshToken(plain: string): string {
  return createHash('sha256').update(plain).digest('hex');
}

export function createRefreshTokenRecord(
  userId: string,
  familyId?: string,
): { record: RefreshTokenRecord; plainToken: string } {
  const plainToken = randomBytes(32).toString('hex');
  const record: RefreshTokenRecord = {
    id: randomUUID(),
    userId,
    tokenHash: hashRefreshToken(plainToken),
    familyId: familyId ?? randomUUID(),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS).toISOString(),
    createdAt: new Date().toISOString(),
  };
  return { record, plainToken };
}

export function isExpired(record: RefreshTokenRecord, now: Date): boolean {
  return new Date(record.expiresAt).getTime() < now.getTime();
}
