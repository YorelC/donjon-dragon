import { randomUUID } from 'crypto';
import { describe, expect, it, vi } from 'vitest';
import type { ClientSession, Connection, Model } from 'mongoose';

import { CharacterId } from '../../domain/character-id';
import type { CharacterDocument } from './character.mapper';
import type { JournalChapterDocument } from './journal-chapter.mapper';
import { MongoCharacterDeletionRepository } from './mongo-character-deletion.repository';

describe('MongoCharacterDeletionRepository', () => {
  it('supprime le personnage et son journal dans la même transaction', async () => {
    const session = {} as ClientSession;
    const connection = {
      transaction: <T>(work: (current: ClientSession) => Promise<T>) => work(session),
    } as unknown as Connection;
    const characters = { deleteOne: vi.fn(async (_filter: object, _options?: object) => ({})) };
    const chapters = { deleteMany: vi.fn(async (_filter: object, _options?: object) => ({})) };
    const id = CharacterId.create(randomUUID());

    await new MongoCharacterDeletionRepository(
      connection,
      characters as unknown as Model<CharacterDocument>,
      chapters as unknown as Model<JournalChapterDocument>,
    ).deleteWithJournal(id);

    expect(chapters.deleteMany).toHaveBeenCalledWith({ characterId: id.value }, { session });
    expect(characters.deleteOne).toHaveBeenCalledWith({ id: id.value }, { session });
  });
});
