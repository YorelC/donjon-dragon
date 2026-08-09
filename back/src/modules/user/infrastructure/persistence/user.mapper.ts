import { User } from '../../domain/user';
import type { UserSnapshot } from '../../domain/user';

/** Agrégat ↔ document Mongo. */
export type UserDocument = UserSnapshot;

export function toDomain(document: UserDocument): User {
  return User.restore(document);
}

export function toPersistence(user: User): UserDocument {
  return user.snapshot();
}
