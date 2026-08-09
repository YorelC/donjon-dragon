import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import { Friendship } from '../domain/friendship';

/**
 * Fabriques pour les tests. Elles gardent la signature en `string` des anciennes
 * fonctions du domaine : un test parle d'identifiants d'utilisateurs qu'il vient
 * de créer, pas de value objects.
 *
 * `now` a une valeur par défaut fixe : la plupart des tests ne s'intéressent pas à
 * la date, et ceux qui s'y intéressent la fournissent.
 */
export function pendingRequest(
  requesterId: string,
  recipientId: string,
  now: Date = TEST_INSTANT,
): Friendship {
  return Friendship.request(
    UserId.create(requesterId),
    UserId.create(recipientId),
    now,
  );
}

/** Mute et renvoie la même instance, pour rester utilisable en une expression. */
export function accept(
  friendship: Friendship,
  actingUserId: string,
  now: Date = TEST_INSTANT,
): Friendship {
  friendship.accept(UserId.create(actingUserId), now);
  return friendship;
}

export function refuse(
  friendship: Friendship,
  actingUserId: string,
  now: Date = TEST_INSTANT,
): Friendship {
  friendship.refuse(UserId.create(actingUserId), now);
  return friendship;
}
