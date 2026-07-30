import type { Friendship } from '@donjon-dragon/shared/friendship-schema';

export interface FriendshipRepositoryPort {
  save(friendship: Friendship): Promise<Friendship>;
  findById(id: string): Promise<Friendship | null>;

  // Relation symétrique : cherche le document entre deux users quel que soit
  // le sens requester/recipient. Sert à empêcher les doublons A→B / B→A.
  findBetween(userAId: string, userBId: string): Promise<Friendship | null>;

  // Amis confirmés (status 'accepted') où userId est requester OU recipient.
  listAcceptedForUser(userId: string): Promise<Friendship[]>;

  // Demandes 'pending' reçues (recipientId === userId).
  listPendingReceived(userId: string): Promise<Friendship[]>;

  // Demandes 'pending' envoyées (requesterId === userId).
  listPendingSent(userId: string): Promise<Friendship[]>;

  deleteById(id: string): Promise<void>;
}
