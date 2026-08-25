import type { UserId } from '@kernel/domain/user-id';

import type { Friendship } from '../../domain/friendship';
import type { FriendshipId } from '../../domain/friendship-id';

export const FRIENDSHIP_REPOSITORY = Symbol('FRIENDSHIP_REPOSITORY');

/**
 * Le port parle l'agrégat, pas le document : c'est l'adapter qui traduit.
 * `save` ne renvoie rien — l'appelant tient déjà l'instance à jour.
 */
export interface FriendshipRepositoryPort {
  create(friendship: Friendship): Promise<void>;
  save(friendship: Friendship): Promise<void>;
  findById(id: FriendshipId): Promise<Friendship | null>;

  // Relation symétrique : cherche le document entre deux users quel que soit
  // le sens requester/recipient. Sert à empêcher les doublons A→B / B→A.
  findBetween(userAId: UserId, userBId: UserId): Promise<Friendship | null>;

  // Amis confirmés (status 'accepted') où userId est requester OU recipient.
  listAcceptedForUser(userId: UserId): Promise<Friendship[]>;

  // Demandes 'pending' reçues (recipientId === userId).
  listPendingReceived(userId: UserId): Promise<Friendship[]>;

  // Demandes 'pending' envoyées (requesterId === userId).
  listPendingSent(userId: UserId): Promise<Friendship[]>;

  /** INV-001 [UA-008] : retourne le nombre exact de demandes 'pending' reçues
   *  pour userId. Doit utiliser un countDocuments (pas un find + length). */
  countPendingReceived(userId: UserId): Promise<number>;

  deleteById(id: FriendshipId): Promise<void>;
}
