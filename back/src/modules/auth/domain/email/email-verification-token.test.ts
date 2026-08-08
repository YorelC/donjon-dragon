import { randomUUID } from 'crypto';
import { describe, it, expect } from 'vitest';
import { UserId } from '@kernel/domain/user-id';

import { TokenSecret } from '../token-secret';
import {
  EMAIL_VERIFICATION_TTL_MS,
  EmailVerificationToken,
} from './email-verification-token';

const alice = UserId.create(randomUUID());

describe('EmailVerificationToken', () => {
  it('ne stocke que l empreinte du secret envoyé par mail', () => {
    const { token, plainToken } = EmailVerificationToken.issue(alice);

    expect(token.snapshot().tokenHash).not.toBe(plainToken);
    expect(token.secret.equals(TokenSecret.fromPlain(plainToken))).toBe(true);
  });

  it('expire après 24 h', () => {
    const { token } = EmailVerificationToken.issue(alice);
    const justBefore = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS - 1000);
    const justAfter = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS + 1000);

    expect(token.isExpired(justBefore)).toBe(false);
    expect(token.isExpired(justAfter)).toBe(true);
  });

  it('fait un aller-retour de réhydratation sans perte', () => {
    const { token } = EmailVerificationToken.issue(alice);

    expect(EmailVerificationToken.restore(token.snapshot()).snapshot()).toEqual(
      token.snapshot(),
    );
  });
});
