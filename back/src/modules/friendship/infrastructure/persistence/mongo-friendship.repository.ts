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

import type {
  CommandId,
  FriendshipRemoval,
  FriendshipRepositoryPort,
} from '../../application/ports/friendship.repository.port';
import type { Friendship } from '../../domain/friendship';
import type { FriendshipId } from '../../domain/friendship-id';
import { FRIENDSHIP_STATUS } from '../../domain/friendship-status';
import {
  FriendRequestAlreadyExistsError,
  FriendshipRevisionConflictError,
} from '../../domain/friendship.errors';
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

  async create(friendship: Friendship, commandId: CommandId): Promise<void> {
    const document = toPersistence(friendship);
    try {
      await this.connection.transaction((session) =>
        this.createWithNotification(
          { document, factType: FRIENDSHIP_FACT.requested, commandId },
          session,
        ),
      );
    } catch (error: unknown) {
      // La transaction ecrit l'amitie ET son outbox : une collision sur un `_id`
      // de message remonterait deguisee en « demande deja existante ». Seul
      // l'index de paire porte cet invariant.
      if (violatesPairKey(error)) throw new FriendRequestAlreadyExistsError();
      throw error;
    }
  }

  async save(friendship: Friendship, commandId: CommandId): Promise<void> {
    const document = toPersistence(friendship);
    await this.connection.transaction((session) =>
      this.saveWithNotification(
        { document, factType: transitionFact(document), commandId },
        session,
      ),
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

  async deleteById(id: FriendshipId, removal: FriendshipRemoval): Promise<void> {
    await this.connection.transaction((session) =>
      this.deleteWithNotification({ id, ...removal }, session),
    );
  }

  private async createWithNotification(
    notification: FriendshipNotification,
    session: ClientSession,
  ): Promise<void> {
    const { document } = notification;
    await this.model.findOneAndReplace(refusedPairFilter(document), document, {
      upsert: true,
      session,
    });
    await this.writeNotification(notification, session);
  }

  private async saveWithNotification(
    notification: FriendshipNotification,
    session: ClientSession,
  ): Promise<void> {
    const { document } = notification;
    const updated = await this.model.findOneAndUpdate(
      expectedRevisionFilter(document),
      document,
      { session },
    );
    // Aucun document ne correspond : soit l'amitie a disparu, soit une autre
    // requete l'a fait avancer entre-temps. Ecraser sans le dire perdrait sa
    // transition, et annoncer un fait ferait refetcher pour un etat qu'on n'a
    // pas ecrit.
    if (!updated) throw new FriendshipRevisionConflictError();
    await this.writeNotification(notification, session);
  }

  private async deleteWithNotification(
    deletion: FriendshipDeletion,
    session: ClientSession,
  ): Promise<void> {
    const document = await this.model
      .findOneAndDelete({ id: deletion.id.value }, { session })
      .lean<FriendshipDocument>();
    if (!document) return;
    await this.writeNotification(removalNotification(document, deletion), session);
  }

  private async writeNotification(
    notification: FriendshipNotification,
    session: ClientSession,
  ): Promise<void> {
    await this.outbox.create([friendshipOutboxMessage(notification)], { session });
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

/** Ce qu'il faut savoir pour écrire un fait : l'état, sa nature, et sa cause. */
interface FriendshipNotification {
  document: FriendshipDocument;
  factType: string;
  commandId: CommandId;
}

interface FriendshipDeletion extends FriendshipRemoval {
  id: FriendshipId;
}

function removalNotification(
  document: FriendshipDocument,
  deletion: FriendshipDeletion,
): FriendshipNotification {
  return {
    document: { ...document, updatedAt: deletion.occurredAt.toISOString() },
    factType: FRIENDSHIP_FACT.removed,
    commandId: deletion.commandId,
  };
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
  notification: FriendshipNotification,
): OutboxMessageDocument {
  const { document, factType, commandId } = notification;
  return createOutboxMessage({
    ownerModule: OWNER_MODULE,
    causationId: commandId,
    aggregateId: document.id,
    aggregateRevision: notifiedRevision(document, factType),
    factType,
    fact: {},
    deliveryChannel: OUTBOX_DELIVERY_CHANNEL.realtime,
    audience: friendshipAudience(document),
    occurredAt: new Date(document.updatedAt),
  });
}

/**
 * La suppression n'est pas une transition de l'agrégat : le document disparaît,
 * donc personne n'incrémente sa révision. Le fait, lui, succède bien au dernier
 * état connu.
 */
function notifiedRevision(document: FriendshipDocument, factType: string): number {
  return factType === FRIENDSHIP_FACT.removed
    ? document.revision + 1
    : document.revision;
}

function friendshipAudience(document: FriendshipDocument) {
  return {
    policy: OUTBOX_AUDIENCE_POLICY.friendshipParticipants,
    userIds: [document.requesterId, document.recipientId] as const,
  };
}

const FIRST_REVISION = 0;

/**
 * La revision attendue est celle d'AVANT la transition. Le `$in` avec `null`
 * couvre les documents ecrits avant l'existence du champ : Mongo ne fait pas
 * correspondre `{ revision: 0 }` a un champ absent, alors que l'agregat, lui,
 * les rehydrate en premiere revision.
 */
function expectedRevisionFilter(document: FriendshipDocument) {
  const expected = document.revision - 1;
  return {
    id: document.id,
    revision: expected === FIRST_REVISION ? { $in: [FIRST_REVISION, null] } : expected,
  };
}

const DUPLICATE_KEY_ERROR_CODE = 11_000;

function isDuplicateKeyError(error: unknown): error is { code: number } {
  if (typeof error !== 'object' || error === null) return false;
  return 'code' in error && error.code === DUPLICATE_KEY_ERROR_CODE;
}

/** L'index unique `pairKey` de `friendship.schema.ts` : un seul document par paire. */
const PAIR_KEY_INDEX = 'pairKey';

function violatesPairKey(error: unknown): boolean {
  if (!isDuplicateKeyError(error) || !('keyPattern' in error)) return false;
  const pattern = (error as { keyPattern: unknown }).keyPattern;
  return !!pattern && typeof pattern === 'object' && PAIR_KEY_INDEX in pattern;
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
