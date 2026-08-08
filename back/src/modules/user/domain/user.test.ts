import { describe, it, expect } from 'vitest';

import { DisplayName, InvalidDisplayNameError } from './display-name';
import { Email, InvalidEmailError } from './email';
import { User } from './user';

const anEmail = Email.create('alice@example.com');
const aDisplayName = DisplayName.create('alice');

describe('User.register', () => {
  it('naît non vérifié', () => {
    const user = User.register({
      email: anEmail,
      displayName: aDisplayName,
      passwordHash: 'hashedpw',
    });

    expect(user.emailVerified).toBe(false);
  });

  it('porte le hash tel qu on le lui donne — il ne hashe rien', () => {
    const user = User.register({
      email: anEmail,
      displayName: aDisplayName,
      passwordHash: 'hashedpw',
    });

    expect(user.passwordHash).toBe('hashedpw');
  });
});

describe('User.markEmailVerified', () => {
  it('passe emailVerified à true', () => {
    const user = User.register({
      email: anEmail,
      displayName: aDisplayName,
      passwordHash: 'hashedpw',
    });

    user.markEmailVerified();

    expect(user.emailVerified).toBe(true);
  });

  it('est idempotent', () => {
    const user = User.register({
      email: anEmail,
      displayName: aDisplayName,
      passwordHash: 'hashedpw',
    });

    user.markEmailVerified();
    user.markEmailVerified();

    expect(user.emailVerified).toBe(true);
  });
});

describe('User — snapshot et réhydratation', () => {
  it('fait un aller-retour sans perte, hash inclus', () => {
    const original = User.register({
      email: anEmail,
      displayName: aDisplayName,
      passwordHash: 'hashedpw',
    });
    original.markEmailVerified();

    const restored = User.restore(original.snapshot());

    expect(restored.snapshot()).toEqual(original.snapshot());
  });
});

describe('Email', () => {
  // Avant, l'adresse etait stockee telle que tapee : Alice@X.com et
  // alice@x.com creaient deux comptes distincts.
  it('normalise la casse et les espaces', () => {
    expect(Email.create('  Alice@Example.COM  ').value).toBe('alice@example.com');
  });

  it('rend l égalité insensible à la casse', () => {
    expect(Email.create('Alice@Example.com').equals(anEmail)).toBe(true);
  });

  it.each(['pasdarobase', 'a@b', 'a@b.', '@example.com', 'a b@example.com'])(
    'refuse %s',
    (raw) => {
      expect(() => Email.create(raw)).toThrow(InvalidEmailError);
    },
  );
});

describe('DisplayName', () => {
  it('retire les espaces de bord', () => {
    expect(DisplayName.create('  alice  ').value).toBe('alice');
  });

  it('refuse un pseudo trop court, espaces compris', () => {
    expect(() => DisplayName.create('a')).toThrow(InvalidDisplayNameError);
    expect(() => DisplayName.create(' a ')).toThrow(InvalidDisplayNameError);
  });

  it('refuse un pseudo trop long', () => {
    expect(() => DisplayName.create('a'.repeat(51))).toThrow(
      InvalidDisplayNameError,
    );
  });
});
