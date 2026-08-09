import { randomUUID } from 'crypto';
import { describe, it, expect } from 'vitest';
import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import { TokenSecret } from '../token-secret';
import {
  EMAIL_VERIFICATION_TTL_MS,
  EmailVerificationToken,
} from './email-verification-token';

const alice = UserId.create(randomUUID());
const NOW = TEST_INSTANT;
const at = (offsetMs: number) => new Date(NOW.getTime() + offsetMs);

describe('EmailVerificationToken', () => {
  it('ne stocke que l empreinte du secret envoyé par mail', () => {
    const { token, plainToken } = EmailVerificationToken.issue(alice, NOW);

    expect(token.snapshot().tokenHash).not.toBe(plainToken);
    expect(token.secret.equals(TokenSecret.fromPlain(plainToken))).toBe(true);
  });

  it('date la création et l expiration à la milliseconde', () => {
    const { token } = EmailVerificationToken.issue(alice, NOW);

    expect(token.snapshot().createdAt).toBe(NOW.toISOString());
    expect(token.snapshot().expiresAt).toBe(at(EMAIL_VERIFICATION_TTL_MS).toISOString());
  });

  it('expire exactement au terme des 24 h, pas avant', () => {
    const { token } = EmailVerificationToken.issue(alice, NOW);

    expect(token.isExpired(at(EMAIL_VERIFICATION_TTL_MS - 1))).toBe(false);
    expect(token.isExpired(at(EMAIL_VERIFICATION_TTL_MS))).toBe(false);
    expect(token.isExpired(at(EMAIL_VERIFICATION_TTL_MS + 1))).toBe(true);
  });

  it('fait un aller-retour de réhydratation sans perte', () => {
    const { token } = EmailVerificationToken.issue(alice, NOW);

    expect(EmailVerificationToken.restore(token.snapshot()).snapshot()).toEqual(
      token.snapshot(),
    );
  });
});
