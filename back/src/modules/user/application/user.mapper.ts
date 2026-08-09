import type { PublicUser } from '@donjon-dragon/shared/user-schema';

import type { User } from '../domain/user';

/**
 * Agrégat → ce que JE vois de MOI-MÊME. Seul endroit qui retire le hash du mot
 * de passe : l'agrégat le porte, la réponse ne le montre jamais.
 */
export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user.snapshot();
  return publicUser;
}

/**
 * Ce que les AUTRES MODULES obtiennent d'un utilisateur : de quoi le désigner
 * (l'id, dont friendship a besoin pour construire ses agrégats) et de quoi
 * l'afficher (le pseudo). Rien de plus — ni email, ni état de vérification.
 *
 * Forme interne au serveur : ce n'est pas ce qui part sur le réseau. Le mapper de
 * réponse de chaque module retire l'id avant de répondre au client.
 */
export interface UserIdentity {
  id: string;
  displayName: string;
}

export function toUserIdentity(user: User): UserIdentity {
  return { id: user.id.value, displayName: user.displayName.value };
}
