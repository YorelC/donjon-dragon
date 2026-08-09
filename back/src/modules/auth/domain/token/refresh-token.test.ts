import { randomUUID } from 'crypto';
import { describe, it, expect } from 'vitest';
import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import { TokenSecret } from '../token-secret';
import {
  REFRESH_GRACE_MS,
  REFRESH_TTL_MS,
  REVOKED_BY,
  RefreshToken,
} from './refresh-token';

const alice = UserId.create(randomUUID());
const bob = UserId.create(randomUUID());

/** Instant de reference : l'agregat ne lit plus l'horloge, on la lui donne. */
const NOW = TEST_INSTANT;
const at = (offsetMs: number) => new Date(NOW.getTime() + offsetMs);

describe('RefreshToken.issue', () => {
  it('rend le secret en clair une seule fois, et ne stocke que son empreinte', () => {
    const { token, plainToken } = RefreshToken.issue(alice, NOW);

    expect(plainToken).toMatch(/^[0-9a-f]{64}$/);
    expect(token.snapshot().tokenHash).not.toBe(plainToken);
    expect(JSON.stringify(token.snapshot())).not.toContain(plainToken);
  });

  it('naît actif et non expiré', () => {
    const { token } = RefreshToken.issue(alice, NOW);

    expect(token.isRevoked).toBe(false);
    expect(token.isExpired(NOW)).toBe(false);
  });

  // Ce que l'horloge injectee rend possible : une date EXACTE, la ou il fallait
  // avant tolerer une marge.
  it("date la creation et l'expiration a la milliseconde", () => {
    const { token } = RefreshToken.issue(alice, NOW);

    expect(token.snapshot().createdAt).toBe(NOW.toISOString());
    expect(token.snapshot().expiresAt).toBe(at(REFRESH_TTL_MS).toISOString());
  });

  it('ouvre une nouvelle lignée à chaque connexion', () => {
    const first = RefreshToken.issue(alice, NOW).token;
    const second = RefreshToken.issue(alice, NOW).token;

    expect(first.familyId.equals(second.familyId)).toBe(false);
  });

  it('poursuit la lignée fournie — c est ce qui rend une fuite détectable', () => {
    const first = RefreshToken.issue(alice, NOW).token;
    const rotated = RefreshToken.issue(alice, NOW, first.familyId).token;

    expect(rotated.familyId.equals(first.familyId)).toBe(true);
    expect(rotated.id).not.toBe(first.id);
  });

  it('expire exactement au terme de la TTL, pas avant', () => {
    const { token } = RefreshToken.issue(alice, NOW);

    // Les trois points qui comptent, dont la limite elle-meme : intestable tant que
    // `issue` lisait l'horloge en interne.
    expect(token.isExpired(at(REFRESH_TTL_MS - 1))).toBe(false);
    expect(token.isExpired(at(REFRESH_TTL_MS))).toBe(false);
    expect(token.isExpired(at(REFRESH_TTL_MS + 1))).toBe(true);
  });
});

describe('RefreshToken.revoke', () => {
  it('révoque, et reste idempotent', () => {
    const { token } = RefreshToken.issue(alice, NOW);

    token.revoke(NOW);
    const firstRevokedAt = token.snapshot().revokedAt;
    token.revoke(at(5_000));

    expect(token.isRevoked).toBe(true);
    expect(token.snapshot().revokedAt).toBe(firstRevokedAt);
  });

  it('date la révocation à l instant fourni', () => {
    const { token } = RefreshToken.issue(alice, NOW);

    token.revoke(at(1_234));

    expect(token.snapshot().revokedAt).toBe(at(1_234).toISOString());
  });

  it('une compromission écrase une rotation, jamais l inverse', () => {
    const { token } = RefreshToken.issue(alice, NOW);

    token.revoke(NOW, REVOKED_BY.rotated);
    token.revoke(NOW, REVOKED_BY.compromised);
    expect(token.snapshot().revokedReason).toBe(REVOKED_BY.compromised);

    token.revoke(NOW, REVOKED_BY.rotated);
    expect(token.snapshot().revokedReason).toBe(REVOKED_BY.compromised);
  });
});

/**
 * La fenetre de grace, testee a ses BORDS.
 *
 * C'est le gain le plus concret de l'injection : ce comportement depend d'un ecart
 * de dix secondes entre deux instants. Le verifier demandait auparavant d'attendre
 * reellement, ou de ne pas le verifier.
 */
describe('RefreshToken.isRecentRotation', () => {
  it('reconnaît une rotation tout juste passée', () => {
    const { token } = RefreshToken.issue(alice, NOW);
    token.revoke(NOW, REVOKED_BY.rotated);

    expect(token.isRecentRotation(REFRESH_GRACE_MS, at(REFRESH_GRACE_MS - 1))).toBe(true);
    expect(token.isRecentRotation(REFRESH_GRACE_MS, at(REFRESH_GRACE_MS))).toBe(true);
    expect(token.isRecentRotation(REFRESH_GRACE_MS, at(REFRESH_GRACE_MS + 1))).toBe(false);
  });

  it("n'accorde AUCUNE grâce à une lignée compromise", () => {
    const { token } = RefreshToken.issue(alice, NOW);
    token.revoke(NOW, REVOKED_BY.compromised);

    // Sinon la victime d'une fuite recevrait des « reessaie » pendant dix secondes
    // au lieu d'un refus net.
    expect(token.isRecentRotation(REFRESH_GRACE_MS, NOW)).toBe(false);
  });

  it('ne reconnaît rien sur un token encore actif', () => {
    const { token } = RefreshToken.issue(alice, NOW);

    expect(token.isRecentRotation(REFRESH_GRACE_MS, NOW)).toBe(false);
  });
});

describe('RefreshToken — appartenance', () => {
  it('ne reconnaît que son porteur', () => {
    const { token } = RefreshToken.issue(alice, NOW);

    expect(token.belongsTo(alice)).toBe(true);
    expect(token.belongsTo(bob)).toBe(false);
  });
});

describe('RefreshToken — réhydratation', () => {
  it('fait un aller-retour sans perte, état de révocation inclus', () => {
    const { token } = RefreshToken.issue(alice, NOW);
    token.revoke(NOW);

    const restored = RefreshToken.restore(token.snapshot());

    expect(restored.snapshot()).toEqual(token.snapshot());
    expect(restored.isRevoked).toBe(true);
  });

  it('retrouve le token depuis le secret présenté par le client', () => {
    const { token, plainToken } = RefreshToken.issue(alice, NOW);

    const restored = RefreshToken.restore(token.snapshot());

    expect(restored.secret.equals(TokenSecret.fromPlain(plainToken))).toBe(true);
    expect(restored.secret.equals(TokenSecret.fromPlain('autre-chose'))).toBe(false);
  });
});
