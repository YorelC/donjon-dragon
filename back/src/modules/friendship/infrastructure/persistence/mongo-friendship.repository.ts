import type { Model } from 'mongoose';
import type { Friendship } from '@donjon-dragon/shared/friendship-schema';

import type { FriendshipRepositoryPort } from '../../application/ports/friendship.repository.port';

export class MongoFriendshipRepository implements FriendshipRepositoryPort {
  constructor(private readonly model: Model<Friendship>) {}

  async save(friendship: Friendship): Promise<Friendship> {
    await this.model.findOneAndUpdate({ id: friendship.id }, friendship, { upsert: true });
    return friendship;
  }

  async findById(id: string): Promise<Friendship | null> {
    const doc = await this.model.findOne({ id }).select('-_id').lean<Friendship>();
    return doc ?? null;
  }

  async findBetween(userAId: string, userBId: string): Promise<Friendship | null> {
    const doc = await this.model
      .findOne({
        $or: [
          { requesterId: userAId, recipientId: userBId },
          { requesterId: userBId, recipientId: userAId },
        ],
      })
      .select('-_id')
      .lean<Friendship>();
    return doc ?? null;
  }

  async listAcceptedForUser(userId: string): Promise<Friendship[]> {
    return this.model
      .find({
        status: 'accepted',
        $or: [{ requesterId: userId }, { recipientId: userId }],
      })
      .select('-_id')
      .lean<Friendship[]>();
  }

  async listPendingReceived(userId: string): Promise<Friendship[]> {
    return this.model
      .find({
        status: 'pending',
        recipientId: userId,
      })
      .select('-_id')
      .lean<Friendship[]>();
  }

  async listPendingSent(userId: string): Promise<Friendship[]> {
    return this.model
      .find({
        status: 'pending',
        requesterId: userId,
      })
      .select('-_id')
      .lean<Friendship[]>();
  }

  async countPendingReceived(userId: string): Promise<number> {
    return this.model.countDocuments({
      status: 'pending',
      recipientId: userId,
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.model.deleteOne({ id });
  }
}
