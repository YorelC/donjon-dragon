import { UserId } from '@kernel/domain/user-id';

import { Friendship } from '../domain/friendship';

/**
 * Fabriques pour les tests. Elles gardent la signature en `string` des anciennes
 * fonctions du domaine : un test parle d'identifiants d'utilisateurs qu'il vient
 * de créer, pas de value objects.
 */
export function pendingRequest(requesterId: string, recipientId: string): Friendship {
  return Friendship.request(UserId.create(requesterId), UserId.create(recipientId));
}

/** Mute et renvoie la même instance, pour rester utilisable en une expression. */
export function accept(friendship: Friendship, actingUserId: string): Friendship {
  friendship.accept(UserId.create(actingUserId));
  return friendship;
}

export function refuse(friendship: Friendship, actingUserId: string): Friendship {
  friendship.refuse(UserId.create(actingUserId));
  return friendship;
}
