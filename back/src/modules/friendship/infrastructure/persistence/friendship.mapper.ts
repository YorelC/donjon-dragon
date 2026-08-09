import { Friendship } from '../../domain/friendship';
import type { FriendshipSnapshot } from '../../domain/friendship';

/**
 * Agrégat ↔ document Mongo. La forme stockée coïncide aujourd'hui avec le
 * snapshot du domaine ; ce mapper existe pour que le jour où elle divergera
 * (champ dénormalisé, renommage, index technique), un seul fichier change.
 */
export type FriendshipDocument = FriendshipSnapshot;

export function toDomain(document: FriendshipDocument): Friendship {
  return Friendship.restore(document);
}

export function toPersistence(friendship: Friendship): FriendshipDocument {
  return friendship.snapshot();
}
