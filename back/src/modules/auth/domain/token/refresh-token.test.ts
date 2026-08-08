import { randomUUID } from 'crypto';
import { describe, it, expect } from 'vitest';
import { UserId } from '@kernel/domain/user-id';

import { TokenSecret } from '../token-secret';
import { REFRESH_TTL_MS, RefreshToken } from './refresh-token';

const alice = UserId.create(randomUUID());
const bob = UserId.create(randomUUID());

describe('RefreshToken.issue', () => {
  it('rend le secret en clair une seule fois, et ne stocke que son empreinte', () => {
    const { token, plainToken } = RefreshToken.issue(alice);

    expect(plainToken).toMatch(/^[0-9a-f]{64}$/);
    expect(token.snapshot().tokenHash).not.toBe(plainToken);
    expect(JSON.stringify(token.snapshot())).not.toContain(plainToken);
  });

  it('naît actif et non expiré', () => {
    const { token } = RefreshToken.issue(alice);

    expect(token.isRevoked).toBe(false);
    expect(token.isExpired(new Date())).toBe(false);
  });

  it('ouvre une nouvelle lignée à chaque connexion', () => {
    const first = RefreshToken.issue(alice).token;
    const second = RefreshToken.issue(alice).token;

    expect(first.familyId.equals(second.familyId)).toBe(false);
  });

  it('poursuit la lignée fournie — c est ce qui rend une fuite détectable', () => {
    const first = RefreshToken.issue(alice).token;
    const rotated = RefreshToken.issue(alice, first.familyId).token;

    expect(rotated.familyId.equals(first.familyId)).toBe(true);
    expect(rotated.id).not.toBe(first.id);
  });

  it('expire après la TTL', () => {
    const { token } = RefreshToken.issue(alice);
    const justBefore = new Date(Date.now() + REFRESH_TTL_MS - 1000);
    const justAfter = new Date(Date.now() + REFRESH_TTL_MS + 1000);

    expect(token.isExpired(justBefore)).toBe(false);
    expect(token.isExpired(justAfter)).toBe(true);
  });
});

describe('RefreshToken.revoke', () => {
  it('révoque, et reste idempotent', () => {
    const { token } = RefreshToken.issue(alice);

    token.revoke();
    const firstRevokedAt = token.snapshot().revokedAt;
    token.revoke();

    expect(token.isRevoked).toBe(true);
    expect(token.snapshot().revokedAt).toBe(firstRevokedAt);
  });
});

describe('RefreshToken — appartenance', () => {
  it('ne reconnaît que son porteur', () => {
    const { token } = RefreshToken.issue(alice);

    expect(token.belongsTo(alice)).toBe(true);
    expect(token.belongsTo(bob)).toBe(false);
  });
});

describe('RefreshToken — réhydratation', () => {
  it('fait un aller-retour sans perte, état de révocation inclus', () => {
    const { token } = RefreshToken.issue(alice);
    token.revoke();

    const restored = RefreshToken.restore(token.snapshot());

    expect(restored.snapshot()).toEqual(token.snapshot());
    expect(restored.isRevoked).toBe(true);
  });

  it('retrouve le token depuis le secret présenté par le client', () => {
    const { token, plainToken } = RefreshToken.issue(alice);

    const restored = RefreshToken.restore(token.snapshot());

    expect(restored.secret.equals(TokenSecret.fromPlain(plainToken))).toBe(true);
    expect(restored.secret.equals(TokenSecret.fromPlain('autre-chose'))).toBe(false);
  });
});
