import type { ClientSession, Connection, Model } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';
import { UserId } from '@kernel/domain/user-id';
import type { OutboxMessageDocument } from '@kernel/infrastructure/outbox-message.schema';
import { Friendship } from '../../domain/friendship';
import { FriendshipId } from '../../domain/friendship-id';
import type { FriendshipDocument } from './friendship.mapper';
import { MongoFriendshipRepository } from './mongo-friendship.repository';

const ALICE_ID = '11111111-1111-4111-8111-111111111111';
const BOB_ID = '22222222-2222-4222-8222-222222222222';
const COMMAND_ID = '33333333-3333-4333-8333-333333333333';
const NOW = new Date('2026-08-28T10:00:00.000Z');
const LATER = new Date('2026-08-28T11:00:00.000Z');

describe('MongoFriendshipRepository', () => {
  it('persiste la demande et son outbox dans la même transaction', async () => {
    const session = {} as ClientSession;
    const replace = vi.fn().mockResolvedValue(null);
    const createOutbox = vi.fn().mockResolvedValue([]);
    const repository = repositoryWith(
      modelWithReplace(replace),
      createOutbox,
      session,
    );

    await repository.create(pendingRequest(), COMMAND_ID);

    expect(replace.mock.calls[0]?.[2]).toMatchObject({ session });
    expect(createOutbox.mock.calls[0]?.[1]).toEqual({ session });
  });

  // Sans elle, un message d'outbox ne se relie plus à la commande qui l'a produit.
  it('reprend l identifiant de commande comme causalité du fait', async () => {
    const createOutbox = vi.fn().mockResolvedValue([]);
    const repository = repositoryWith(
      modelWithReplace(vi.fn().mockResolvedValue(null)),
      createOutbox,
    );

    await repository.create(pendingRequest(), COMMAND_ID);

    expect(writtenMessage(createOutbox).causationId).toBe(COMMAND_ID);
  });

  it('diffuse la révision de l agrégat, pas une valeur déduite du fait', async () => {
    const createOutbox = vi.fn().mockResolvedValue([]);
    const repository = repositoryWith(modelWithUpdate(anExistingDocument()), createOutbox);
    const friendship = pendingRequest();
    friendship.accept(UserId.create(BOB_ID), LATER);

    await repository.save(friendship, COMMAND_ID);

    expect(writtenMessage(createOutbox).aggregateRevision).toBe(friendship.revision);
  });

  // Annoncer un fait sur une écriture sans effet ferait refetcher les deux
  // participants pour un état inchangé.
  it('n annonce rien quand la mise à jour ne trouve personne', async () => {
    const createOutbox = vi.fn().mockResolvedValue([]);
    const repository = repositoryWith(modelWithUpdate(null), createOutbox);

    await repository.save(pendingRequest(), COMMAND_ID);

    expect(createOutbox).not.toHaveBeenCalled();
  });

  // La suppression n'incrémente rien : le document part. Le fait succède quand même
  // au dernier état connu.
  it('diffuse la révision suivante à la suppression', async () => {
    const createOutbox = vi.fn().mockResolvedValue([]);
    const stored = { ...pendingRequest().snapshot(), pairKey: 'pair' };
    const repository = repositoryWith(modelWithDelete(stored), createOutbox);

    await repository.deleteById(FriendshipId.create(stored.id), {
      commandId: COMMAND_ID,
      occurredAt: LATER,
    });

    expect(writtenMessage(createOutbox).aggregateRevision).toBe(stored.revision + 1);
  });
});

function pendingRequest(): Friendship {
  return Friendship.request(UserId.create(ALICE_ID), UserId.create(BOB_ID), NOW);
}

function repositoryWith(
  model: Model<FriendshipDocument>,
  createOutbox: ReturnType<typeof vi.fn>,
  session: ClientSession = {} as ClientSession,
): MongoFriendshipRepository {
  return new MongoFriendshipRepository(
    model,
    outboxWithCreate(createOutbox),
    connectionWithSession(session),
  );
}

function writtenMessage(
  createOutbox: ReturnType<typeof vi.fn>,
): OutboxMessageDocument {
  return (createOutbox.mock.calls[0]?.[0] as OutboxMessageDocument[])[0]!;
}

function modelWithReplace(replace: ReturnType<typeof vi.fn>) {
  return { findOneAndReplace: replace } as unknown as Model<FriendshipDocument>;
}

function modelWithUpdate(updated: FriendshipDocument | null) {
  return {
    findOneAndUpdate: vi.fn().mockResolvedValue(updated),
  } as unknown as Model<FriendshipDocument>;
}

function anExistingDocument(): FriendshipDocument {
  return { ...pendingRequest().snapshot(), pairKey: 'pair' };
}

function modelWithDelete(document: FriendshipDocument) {
  return {
    findOneAndDelete: vi.fn(() => ({ lean: () => Promise.resolve(document) })),
  } as unknown as Model<FriendshipDocument>;
}

function outboxWithCreate(create: ReturnType<typeof vi.fn>) {
  return { create } as unknown as Model<OutboxMessageDocument>;
}

function connectionWithSession(session: ClientSession): Connection {
  return {
    transaction: vi.fn((work: (value: ClientSession) => Promise<void>) =>
      work(session),
    ),
  } as unknown as Connection;
}
