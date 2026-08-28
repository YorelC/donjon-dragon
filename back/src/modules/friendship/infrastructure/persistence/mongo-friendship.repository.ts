import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { ClientSession, Connection, Model } from 'mongoose';
import { UserId } from '@kernel/domain/user-id';
import {
  OUTBOX_AUDIENCE_POLICY,
  OUTBOX_DELIVERY_CHANNEL,
} from '@kernel/infrastructure/outbox-message.contract';
import { createOutboxMessage } from '@kernel/infrastructure/outbox-message.factory';
import {
  OUTBOX_MESSAGE_MODEL,
  type OutboxMessageDocument,
} from '@kernel/infrastructure/outbox-message.schema';

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

const OWNER_MODULE = 'friendship';
const FRIENDSHIP_FACT = {
  requested: 'friendship.requested',
  accepted: 'friendship.accepted',
  refused: 'friendship.refused',
  removed: 'friendship.removed',
} as const;

@Injectable()
export class MongoFriendshipRepository implements FriendshipRepositoryPort {
  constructor(
    @InjectModel(FRIENDSHIP_MODEL) private readonly model: Model<FriendshipDocument>,
    @InjectModel(OUTBOX_MESSAGE_MODEL)
    private readonly outbox: Model<OutboxMessageDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(friendship: Friendship): Promise<void> {
    const document = toPersistence(friendship);
    try {
      await this.connection.transaction((session) =>
        this.createWithNotification(document, session),
      );
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) throw new FriendRequestAlreadyExistsError();
      throw error;
    }
  }

  async save(friendship: Friendship): Promise<void> {
    const document = toPersistence(friendship);
    await this.connection.transaction((session) =>
      this.saveWithNotification(document, session),
    );
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

  async deleteById(id: FriendshipId, occurredAt: Date): Promise<void> {
    await this.connection.transaction((session) =>
      this.deleteWithNotification({ id, occurredAt }, session),
    );
  }

  private async createWithNotification(
    document: FriendshipDocument,
    session: ClientSession,
  ): Promise<void> {
    await this.model.findOneAndReplace(refusedPairFilter(document), document, {
      upsert: true,
      session,
    });
    await this.writeNotification(document, FRIENDSHIP_FACT.requested, session);
  }

  private async saveWithNotification(
    document: FriendshipDocument,
    session: ClientSession,
  ): Promise<void> {
    await this.model.findOneAndUpdate({ id: document.id }, document, { session });
    await this.writeNotification(document, transitionFact(document), session);
  }

  private async deleteWithNotification(
    removal: FriendshipRemoval,
    session: ClientSession,
  ): Promise<void> {
    const document = await this.model
      .findOneAndDelete({ id: removal.id.value }, { session })
      .lean<FriendshipDocument>();
    if (!document) return;
    await this.writeNotification(
      { ...document, updatedAt: removal.occurredAt.toISOString() },
      FRIENDSHIP_FACT.removed,
      session,
    );
  }

  private async writeNotification(
    document: FriendshipDocument,
    factType: string,
    session: ClientSession,
  ): Promise<void> {
    const message = friendshipOutboxMessage(document, factType);
    await this.outbox.create([message], { session });
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

interface FriendshipRemoval {
  id: FriendshipId;
  occurredAt: Date;
}

function refusedPairFilter(document: FriendshipDocument) {
  return {
    ...friendshipParticipantsFilterValues(
      document.requesterId,
      document.recipientId,
    ),
    status: FRIENDSHIP_STATUS.refused,
  };
}

function transitionFact(document: FriendshipDocument): string {
  return document.status === FRIENDSHIP_STATUS.accepted
    ? FRIENDSHIP_FACT.accepted
    : FRIENDSHIP_FACT.refused;
}

function friendshipOutboxMessage(
  document: FriendshipDocument,
  factType: string,
): OutboxMessageDocument {
  return createOutboxMessage({
    ownerModule: OWNER_MODULE,
    causationId: randomUUID(),
    aggregateId: document.id,
    aggregateRevision: revisionFor(document, factType),
    factType,
    fact: {},
    deliveryChannel: OUTBOX_DELIVERY_CHANNEL.realtime,
    audience: friendshipAudience(document),
    occurredAt: new Date(document.updatedAt),
  });
}

function friendshipAudience(document: FriendshipDocument) {
  return {
    policy: OUTBOX_AUDIENCE_POLICY.friendshipParticipants,
    userIds: [document.requesterId, document.recipientId] as const,
  };
}

function revisionFor(document: FriendshipDocument, factType: string): number {
  if (factType === FRIENDSHIP_FACT.requested) return 0;
  if (factType === FRIENDSHIP_FACT.removed) return 2;
  return 1;
}

const DUPLICATE_KEY_ERROR_CODE = 11_000;

function isDuplicateKeyError(error: unknown): error is { code: number } {
  if (typeof error !== 'object' || error === null) return false;
  return 'code' in error && error.code === DUPLICATE_KEY_ERROR_CODE;
}

function friendshipParticipantsFilter(userAId: UserId, userBId: UserId) {
  return friendshipParticipantsFilterValues(userAId.value, userBId.value);
}

function friendshipParticipantsFilterValues(userAId: string, userBId: string) {
  return {
    $or: [
      {
        pairKey: friendshipPairKey(
          UserId.create(userAId),
          UserId.create(userBId),
        ),
      },
      { requesterId: userAId, recipientId: userBId },
      { requesterId: userBId, recipientId: userAId },
    ],
  };
}
