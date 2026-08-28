import type { UserId } from '@kernel/domain/user-id';

import type { Friendship } from '../../domain/friendship';
import type { FriendshipId } from '../../domain/friendship-id';

export const FRIENDSHIP_REPOSITORY = Symbol('FRIENDSHIP_REPOSITORY');

/**
 * Identifiant de l'occurrence de commande qui provoque l'écriture. Il devient la
 * causalité du fait diffusé : sans lui, un message d'outbox ne se relie plus à ce
 * qui l'a produit. Le jour où l'amitié rejoindra l'enveloppe de la phase 5A, ce
 * sera l'identifiant du reçu de commande.
 */
export type CommandId = string;

/** Ce qui date et motive une suppression, l'agrégat ayant disparu. */
export interface FriendshipRemoval {
  commandId: CommandId;
  occurredAt: Date;
}

/**
 * Le port parle l'agrégat, pas le document : c'est l'adapter qui traduit.
 * `save` ne renvoie rien — l'appelant tient déjà l'instance à jour.
 */
export interface FriendshipRepositoryPort {
  create(friendship: Friendship, commandId: CommandId): Promise<void>;
  save(friendship: Friendship, commandId: CommandId): Promise<void>;
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

  deleteById(id: FriendshipId, removal: FriendshipRemoval): Promise<void>;
}
