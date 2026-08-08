import type { Friendship as FriendshipResponse } from '@donjon-dragon/shared/friendship-schema';

import type { Friendship } from '../domain/friendship';

/**
 * Agrégat → contrat HTTP. Le type de retour vient de shared/, donc toute
 * divergence entre le statut du domaine et FriendshipStatusEnum casse le
 * typecheck : c'est ce qui autorise le domaine à déclarer son propre statut
 * sans dépendre du schéma de transport.
 */
export function toFriendshipResponse(friendship: Friendship): FriendshipResponse {
  return friendship.snapshot();
}
