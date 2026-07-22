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
    createdAt: new Date().toISOString(),
  };
}

export function toPublicUser(user: User) {
  const { passwordHash: _, ...pub } = user;
  return pub;
}
