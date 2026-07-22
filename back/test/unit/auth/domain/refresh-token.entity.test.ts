// ============================================================
// back/test/unit/auth/domain/refresh-token.entity.test.ts
// Tests — Entité refresh token (fonctions pures / crypto déterministe)
// ============================================================
// RED: ces tests échouent car refresh-token.entity.ts n'existe pas
// ============================================================

import { describe, it, expect } from 'vitest';

import {
  createRefreshTokenRecord,
  hashRefreshToken,
  isExpired,
  REFRESH_TTL_MS,
} from '../../../../src/auth/domain/refresh-token.entity.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const USER_ID = crypto.randomUUID();

describe('refresh-token.entity — hashRefreshToken()', () => {
  it('est déterministe', () => {
    expect(hashRefreshToken('abc')).toBe(hashRefreshToken('abc'));
  });

  it('diffère pour une entrée différente', () => {
    expect(hashRefreshToken('abc')).not.toBe(hashRefreshToken('abd'));
  });

  it('retourne un hex SHA-256 (64 caractères)', () => {
    expect(hashRefreshToken('abc')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('refresh-token.entity — createRefreshTokenRecord()', () => {
  it('retourne un record + le token en clair', () => {
    const { record, plainToken } = createRefreshTokenRecord(USER_ID);
    expect(typeof plainToken).toBe('string');
    expect(plainToken.length).toBeGreaterThan(0);
    expect(record.id).toMatch(UUID_RE);
    expect(record.userId).toBe(USER_ID);
  });

  it('stocke le hash du token, pas le token brut', () => {
    const { record, plainToken } = createRefreshTokenRecord(USER_ID);
    expect(record.tokenHash).toBe(hashRefreshToken(plainToken));
    expect(record.tokenHash).not.toBe(plainToken);
  });

  it('génère un familyId si non fourni', () => {
    expect(createRefreshTokenRecord(USER_ID).record.familyId).toMatch(UUID_RE);
  });

  it('réutilise le familyId fourni (rotation)', () => {
    const familyId = crypto.randomUUID();
    expect(createRefreshTokenRecord(USER_ID, familyId).record.familyId).toBe(
      familyId,
    );
  });

  it('fixe expiresAt à ~ now + REFRESH_TTL_MS', () => {
    const before = Date.now();
    const { record } = createRefreshTokenRecord(USER_ID);
    const exp = new Date(record.expiresAt).getTime();
    expect(exp).toBeGreaterThanOrEqual(before + REFRESH_TTL_MS - 2000);
    expect(exp).toBeLessThanOrEqual(Date.now() + REFRESH_TTL_MS + 2000);
  });

  it('n\'est pas révoqué à la création', () => {
    expect(createRefreshTokenRecord(USER_ID).record.revokedAt).toBeUndefined();
  });

  it('TTL par défaut de 7 jours', () => {
    expect(REFRESH_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe('refresh-token.entity — isExpired()', () => {
  it('false si expiresAt est dans le futur', () => {
    const { record } = createRefreshTokenRecord(USER_ID);
    expect(isExpired(record, new Date())).toBe(false);
  });

  it('true si expiresAt est dans le passé', () => {
    const { record } = createRefreshTokenRecord(USER_ID);
    const later = new Date(Date.now() + REFRESH_TTL_MS + 1000);
    expect(isExpired(record, later)).toBe(true);
  });
});
