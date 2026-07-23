import { createHash, randomBytes, randomUUID } from 'crypto';
import type { EmailVerificationTokenRecord } from '@donjon-dragon/shared/auth-schema';

export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export function hashVerificationToken(plain: string): string {
  return createHash('sha256').update(plain).digest('hex');
}

export function createEmailVerificationToken(userId: string): {
  record: EmailVerificationTokenRecord;
  plainToken: string;
} {
  const plainToken = randomBytes(32).toString('hex');
  const record: EmailVerificationTokenRecord = {
    id: randomUUID(),
    userId,
    tokenHash: hashVerificationToken(plainToken),
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS).toISOString(),
    createdAt: new Date().toISOString(),
  };
  return { record, plainToken };
}

export function isExpired(
  record: EmailVerificationTokenRecord,
  now: Date,
): boolean {
  return new Date(record.expiresAt).getTime() < now.getTime();
}
