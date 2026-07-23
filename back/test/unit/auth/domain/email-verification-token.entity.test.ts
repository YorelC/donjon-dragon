// ============================================================
// back/test/unit/auth/domain/email-verification-token.entity.test.ts
// Tests — Entité token de vérification d'email (fonctions pures / crypto)
// ============================================================

import { describe, it, expect } from 'vitest';

import {
  createEmailVerificationToken,
  hashVerificationToken,
  isExpired,
  EMAIL_VERIFICATION_TTL_MS,
} from '../../../../src/auth/domain/email-verification-token.entity.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const USER_ID = crypto.randomUUID();

describe('email-verification-token.entity — hashVerificationToken()', () => {
  it('est déterministe', () => {
    expect(hashVerificationToken('abc')).toBe(hashVerificationToken('abc'));
  });

  it('diffère pour une entrée différente', () => {
    expect(hashVerificationToken('abc')).not.toBe(hashVerificationToken('abd'));
  });

  it('retourne un hex SHA-256 (64 caractères)', () => {
    expect(hashVerificationToken('abc')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('email-verification-token.entity — createEmailVerificationToken()', () => {
  it('retourne un record + le token en clair', () => {
    const { record, plainToken } = createEmailVerificationToken(USER_ID);
    expect(typeof plainToken).toBe('string');
    expect(plainToken.length).toBeGreaterThan(0);
    expect(record.id).toMatch(UUID_RE);
    expect(record.userId).toBe(USER_ID);
  });

  it('stocke le hash du token, pas le token brut', () => {
    const { record, plainToken } = createEmailVerificationToken(USER_ID);
    expect(record.tokenHash).toBe(hashVerificationToken(plainToken));
    expect(record.tokenHash).not.toBe(plainToken);
  });

  it('n\'a ni familyId ni revokedAt (usage unique, pas de rotation)', () => {
    const { record } = createEmailVerificationToken(USER_ID);
    expect(record).not.toHaveProperty('familyId');
    expect(record).not.toHaveProperty('revokedAt');
  });

  it('fixe expiresAt à ~ now + EMAIL_VERIFICATION_TTL_MS', () => {
    const before = Date.now();
    const { record } = createEmailVerificationToken(USER_ID);
    const exp = new Date(record.expiresAt).getTime();
    expect(exp).toBeGreaterThanOrEqual(before + EMAIL_VERIFICATION_TTL_MS - 2000);
    expect(exp).toBeLessThanOrEqual(Date.now() + EMAIL_VERIFICATION_TTL_MS + 2000);
  });

  it('TTL par défaut de 24 heures', () => {
    expect(EMAIL_VERIFICATION_TTL_MS).toBe(24 * 60 * 60 * 1000);
  });
});

describe('email-verification-token.entity — isExpired()', () => {
  it('false si expiresAt est dans le futur', () => {
    const { record } = createEmailVerificationToken(USER_ID);
    expect(isExpired(record, new Date())).toBe(false);
  });

  it('true si expiresAt est dans le passé', () => {
    const { record } = createEmailVerificationToken(USER_ID);
    const later = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS + 1000);
    expect(isExpired(record, later)).toBe(true);
  });
});
