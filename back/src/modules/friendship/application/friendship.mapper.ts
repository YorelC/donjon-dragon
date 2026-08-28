import type { FriendRequest } from '@donjon-dragon/shared/friendship-schema';
import type { UserSummary } from '@donjon-dragon/shared/user-schema';

import type { Friendship } from '../domain/friendship';
import type { DirectoryUser } from './ports/friend-directory.port';

/**
 * Agrégat → contrat HTTP. `requesterId` et `recipientId` sont volontairement
 * absents : le client n'a pas à connaître l'identité système des autres joueurs.
 * Seul `id` reste, parce que c'est le handle de la ressource — celui qu'on
 * accepte, refuse ou supprime.
 *
 * `revision` sort pour une autre raison : c'est une mécanique de persistance et
 * de diffusion, pas une donnée du contrat. Le retrait doit rester explicite —
 * un spread la laisserait fuir sans que le typage ne bronche.
 */
export function toFriendRequestResponse(friendship: Friendship): FriendRequest {
  const {
    requesterId: _requesterId,
    recipientId: _recipientId,
    revision: _revision,
    ...response
  } = friendship.snapshot();

  return response;
}

/** Annuaire → contrat HTTP : c'est ici que l'identifiant s'arrête. */
export function toUserSummary(user: DirectoryUser): UserSummary {
  return { displayName: user.displayName };
}
