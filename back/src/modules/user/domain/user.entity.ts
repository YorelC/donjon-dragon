import { randomUUID } from 'crypto';
import type { User } from '@donjon-dragon/shared/user-schema';

export type CreateUserParams = {
  email: string;
  displayName: string;
  passwordHash: string;
};

export function createUser(params: CreateUserParams): User {
  return {
    id: randomUUID(),
    email: params.email,
    displayName: params.displayName,
    passwordHash: params.passwordHash,
    // Toujours false à la création : la vérification d'email l'active.
    emailVerified: false,
    createdAt: new Date().toISOString(),
  };
}

/** Seule transition de l'agrégat : la vérification d'email. */
export function markEmailVerified(user: User): User {
  return { ...user, emailVerified: true };
}
