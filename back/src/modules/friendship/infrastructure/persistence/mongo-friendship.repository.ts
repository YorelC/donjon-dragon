import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { UserId } from '@kernel/domain/user-id';

import type { FriendshipRepositoryPort } from '../../application/ports/friendship.repository.port';
import type { Friendship } from '../../domain/friendship';
import type { FriendshipId } from '../../domain/friendship-id';
import { FRIENDSHIP_STATUS } from '../../domain/friendship-status';
import { FriendRequestAlreadyExistsError } from '../../domain/friendship.errors';
import { friendshipPairKey } from '../../domain/friendship-pair-key';
import {
  toDomain,
  toPersistence,
  type FriendshipDocument,
} from './friendship.mapper';
import { FRIENDSHIP_MODEL } from './friendship.schema';

@Injectable()
export class MongoFriendshipRepository implements FriendshipRepositoryPort {
  constructor(
    @InjectModel(FRIENDSHIP_MODEL) private readonly model: Model<FriendshipDocument>,
  ) {}

  async create(friendship: Friendship): Promise<void> {
    const document = toPersistence(friendship);
    try {
      await this.model.findOneAndReplace(
        {
          ...friendshipParticipantsFilter(
            friendship.requesterId,
            friendship.recipientId,
          ),
          status: FRIENDSHIP_STATUS.refused,
        },
        document,
        { upsert: true },
      );
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) throw new FriendRequestAlreadyExistsError();
      throw error;
    }
  }

  async save(friendship: Friendship): Promise<void> {
    const document = toPersistence(friendship);
    await this.model.findOneAndUpdate({ id: document.id }, document, { upsert: true });
  }

  async findById(id: FriendshipId): Promise<Friendship | null> {
    return this.findOne({ id: id.value });
  }

  async findBetween(userAId: UserId, userBId: UserId): Promise<Friendship | null> {
    return this.findOne(friendshipParticipantsFilter(userAId, userBId));
  }

  async listAcceptedForUser(userId: UserId): Promise<Friendship[]> {
    return this.findMany({
      status: FRIENDSHIP_STATUS.accepted,
      $or: [{ requesterId: userId.value }, { recipientId: userId.value }],
    });
  }

  async listPendingReceived(userId: UserId): Promise<Friendship[]> {
    return this.findMany({
      status: FRIENDSHIP_STATUS.pending,
      recipientId: userId.value,
    });
  }

  async listPendingSent(userId: UserId): Promise<Friendship[]> {
    return this.findMany({
      status: FRIENDSHIP_STATUS.pending,
      requesterId: userId.value,
    });
  }

  async countPendingReceived(userId: UserId): Promise<number> {
    return this.model.countDocuments({
      status: FRIENDSHIP_STATUS.pending,
      recipientId: userId.value,
    });
  }

  async deleteById(id: FriendshipId): Promise<void> {
    await this.model.deleteOne({ id: id.value });
  }

  private async findOne(
    filter: Record<string, unknown>,
  ): Promise<Friendship | null> {
    const doc = await this.model
      .findOne(filter)
      .select('-_id')
      .lean<FriendshipDocument>();

    return doc ? toDomain(doc) : null;
  }

  private async findMany(filter: Record<string, unknown>): Promise<Friendship[]> {
    const docs = await this.model
      .find(filter)
      .select('-_id')
      .lean<FriendshipDocument[]>();

    return docs.map(toDomain);
  }
}

const DUPLICATE_KEY_ERROR_CODE = 11_000;

function isDuplicateKeyError(error: unknown): error is { code: number } {
  if (typeof error !== 'object' || error === null) return false;
  return 'code' in error && error.code === DUPLICATE_KEY_ERROR_CODE;
}

function friendshipParticipantsFilter(userAId: UserId, userBId: UserId) {
  return {
    $or: [
      { pairKey: friendshipPairKey(userAId, userBId) },
      { requesterId: userAId.value, recipientId: userBId.value },
      { requesterId: userBId.value, recipientId: userAId.value },
    ],
  };
}
