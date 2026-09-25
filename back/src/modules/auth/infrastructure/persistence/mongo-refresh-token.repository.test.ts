import { describe, expect, it, vi } from 'vitest';
import type { ClientSession, Connection, Model } from 'mongoose';
import { UserId } from '@kernel/domain/user-id';
import { RefreshToken } from '../../domain/token/refresh-token';
import type { RefreshTokenDocument } from './refresh-token.mapper';
import { MongoRefreshTokenRepository } from './mongo-refresh-token.repository';

const NOW = new Date('2026-09-25T08:00:00.000Z');

describe('MongoRefreshTokenRepository.rotate', () => {
  it('révoque conditionnellement puis insère le successeur dans la même transaction', async () => {
    const harness = repositoryHarness(1);
    const pair = tokenPair();

    await expect(harness.repository.rotate(pair.consumed, pair.successor)).resolves.toBe(true);

    expect(harness.updateOne).toHaveBeenCalledWith(
      { id: pair.consumed.id, revokedAt: { $exists: false } },
      expect.objectContaining({ $set: expect.objectContaining({ revokedReason: 'rotated' }) }),
      { session: harness.session },
    );
    expect(harness.create).toHaveBeenCalledWith(
      [expect.objectContaining({ id: pair.successor.id })],
      { session: harness.session },
    );
  });

  it('n insère aucun successeur quand une rotation concurrente a gagné', async () => {
    const harness = repositoryHarness(0);
    const pair = tokenPair();

    await expect(harness.repository.rotate(pair.consumed, pair.successor)).resolves.toBe(false);

    expect(harness.create).not.toHaveBeenCalled();
  });
});

function tokenPair() {
  const issued = RefreshToken.issue(UserId.create('00000000-0000-4000-8000-000000000001'), NOW);
  const successor = RefreshToken.issue(issued.token.userId, NOW, issued.token.familyId).token;
  issued.token.revoke(NOW);
  return { consumed: issued.token, successor };
}

function repositoryHarness(matchedCount: number) {
  const session = {} as ClientSession;
  const updateOne = vi.fn().mockResolvedValue({ matchedCount });
  const create = vi.fn().mockResolvedValue([]);
  const model = { updateOne, create } as unknown as Model<RefreshTokenDocument>;
  const transaction = vi.fn(async (work: (value: ClientSession) => unknown) => work(session));
  const connection = { transaction } as unknown as Connection;
  const repository = new MongoRefreshTokenRepository(model, connection);
  return { repository, session, updateOne, create };
}
