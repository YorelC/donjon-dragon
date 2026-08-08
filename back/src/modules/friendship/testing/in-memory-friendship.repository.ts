import type { UserId } from '@kernel/domain/user-id';

import type { FriendshipRepositoryPort } from '../application/ports/friendship.repository.port';
import type { Friendship } from '../domain/friendship';
import type { FriendshipId } from '../domain/friendship-id';

export class InMemoryFriendshipRepository implements FriendshipRepositoryPort {
  private readonly friendships = new Map<string, Friendship>();

  async save(friendship: Friendship): Promise<void> {
    this.friendships.set(friendship.id.value, friendship);
  }

  async findById(id: FriendshipId): Promise<Friendship | null> {
    return this.friendships.get(id.value) ?? null;
  }

  async findBetween(userAId: UserId, userBId: UserId): Promise<Friendship | null> {
    return (
      this.all().find(
        (f) => f.involves(userAId) && f.involves(userBId),
      ) ?? null
    );
  }

  async listAcceptedForUser(userId: UserId): Promise<Friendship[]> {
    return this.all().filter((f) => f.status === 'accepted' && f.involves(userId));
  }

  async listPendingReceived(userId: UserId): Promise<Friendship[]> {
    return this.all().filter(
      (f) => f.status === 'pending' && f.recipientId.equals(userId),
    );
  }

  async listPendingSent(userId: UserId): Promise<Friendship[]> {
    return this.all().filter(
      (f) => f.status === 'pending' && f.requesterId.equals(userId),
    );
  }

  async countPendingReceived(userId: UserId): Promise<number> {
    return (await this.listPendingReceived(userId)).length;
  }

  async deleteById(id: FriendshipId): Promise<void> {
    this.friendships.delete(id.value);
  }

  private all(): Friendship[] {
    return [...this.friendships.values()];
  }
}
