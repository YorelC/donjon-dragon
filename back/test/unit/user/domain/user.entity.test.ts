// ============================================================
// back/test/unit/user/domain/user.entity.test.ts
// Tests — Entité User (fonctions pures)
// ============================================================
// RED: ces tests échouent car user.entity.ts n'existe pas
// ============================================================

import { describe, it, expect } from 'vitest';

import {
  createUser,
  toPublicUser,
  type CreateUserParams,
} from '../../../../src/user/domain/user.entity.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const params: CreateUserParams = {
  email: 'aragorn@gondor.me',
  displayName: 'Aragorn',
  passwordHash: 'hashed:secret123',
};

describe('user.entity — createUser()', () => {
  it('génère un UUID valide', () => {
    expect(createUser(params).id).toMatch(UUID_RE);
  });

  it('conserve email, displayName et passwordHash', () => {
    const user = createUser(params);
    expect(user.email).toBe(params.email);
    expect(user.displayName).toBe(params.displayName);
    expect(user.passwordHash).toBe(params.passwordHash);
  });

  it('génère un createdAt ISO', () => {
    expect(createUser(params).createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    );
  });

  it('ne stocke jamais le mot de passe en clair', () => {
    expect(createUser(params).passwordHash).not.toBe('secret123');
  });
});

describe('user.entity — toPublicUser()', () => {
  it('retire le passwordHash', () => {
    const pub = toPublicUser(createUser(params));
    expect(pub).not.toHaveProperty('passwordHash');
  });

  it('conserve les champs publics', () => {
    const user = createUser(params);
    const pub = toPublicUser(user);
    expect(pub.id).toBe(user.id);
    expect(pub.email).toBe(user.email);
    expect(pub.displayName).toBe(user.displayName);
  });
});
