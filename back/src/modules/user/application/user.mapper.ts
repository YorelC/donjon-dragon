import type { PublicUser, User } from '@donjon-dragon/shared/user-schema';

/**
 * Sérialisation, pas domaine : retire le hash du mot de passe avant que
 * l'utilisateur ne quitte le module.
 *
 * Vit dans application/ et non presentation/ parce que ce sont les use-cases
 * qui produisent des PublicUser — l'inverse inverserait le sens des flèches à
 * l'intérieur du module.
 */
export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}
