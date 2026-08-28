import type { ClientSession, Connection, Model } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';
import { UserId } from '@kernel/domain/user-id';
import type { OutboxMessageDocument } from '@kernel/infrastructure/outbox-message.schema';
import { Friendship } from '../../domain/friendship';
import type { FriendshipDocument } from './friendship.mapper';
import { MongoFriendshipRepository } from './mongo-friendship.repository';

const ALICE_ID = '11111111-1111-4111-8111-111111111111';
const BOB_ID = '22222222-2222-4222-8222-222222222222';
const NOW = new Date('2026-08-28T10:00:00.000Z');

describe('MongoFriendshipRepository', () => {
  it('persiste la demande et son outbox dans la même transaction', async () => {
    const session = {} as ClientSession;
    const replace = vi.fn().mockResolvedValue(null);
    const createOutbox = vi.fn().mockResolvedValue([]);
    const repository = new MongoFriendshipRepository(
      modelWithReplace(replace),
      outboxWithCreate(createOutbox),
      connectionWithSession(session),
    );
    const friendship = Friendship.request(
      UserId.create(ALICE_ID),
      UserId.create(BOB_ID),
      NOW,
    );

    await repository.create(friendship);

    expect(replace.mock.calls[0]?.[2]).toMatchObject({ session });
    expect(createOutbox.mock.calls[0]?.[1]).toEqual({ session });
  });
});

function modelWithReplace(replace: ReturnType<typeof vi.fn>) {
  return { findOneAndReplace: replace } as unknown as Model<FriendshipDocument>;
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
