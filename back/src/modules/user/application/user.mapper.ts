import type { PublicUser } from '@donjon-dragon/shared/user-schema';

import type { User } from '../domain/user';

/**
 * Agrégat → contrat HTTP. C'est le SEUL endroit qui retire le hash du mot de
 * passe : l'agrégat le porte, la réponse ne le montre jamais.
 */
export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user.snapshot();
  return publicUser;
}
