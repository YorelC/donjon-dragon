import type { Friendship } from '@donjon-dragon/shared/friendship-schema';

import type { FriendshipRepositoryPort } from '../03-domain/friendship.repository.port';

export class InMemoryFriendshipRepository implements FriendshipRepositoryPort {
  private readonly friendships = new Map<string, Friendship>();

  async save(friendship: Friendship): Promise<Friendship> {
    this.friendships.set(friendship.id, friendship);
    return friendship;
  }

  async findById(id: string): Promise<Friendship | null> {
    return this.friendships.get(id) ?? null;
  }

  async findBetween(userAId: string, userBId: string): Promise<Friendship | null> {
    const docs = [...this.friendships.values()];
    return (
      docs.find(
        (f) =>
          (f.requesterId === userAId && f.recipientId === userBId) ||
          (f.requesterId === userBId && f.recipientId === userAId),
      ) ?? null
    );
  }

  async listAcceptedForUser(userId: string): Promise<Friendship[]> {
    return [...this.friendships.values()].filter(
      (f) => f.status === 'accepted' && (f.requesterId === userId || f.recipientId === userId),
    );
  }

  async listPendingReceived(userId: string): Promise<Friendship[]> {
    return [...this.friendships.values()].filter(
      (f) => f.status === 'pending' && f.recipientId === userId,
    );
  }

  async listPendingSent(userId: string): Promise<Friendship[]> {
    return [...this.friendships.values()].filter(
      (f) => f.status === 'pending' && f.requesterId === userId,
    );
  }

  async deleteById(id: string): Promise<void> {
    this.friendships.delete(id);
  }
}
