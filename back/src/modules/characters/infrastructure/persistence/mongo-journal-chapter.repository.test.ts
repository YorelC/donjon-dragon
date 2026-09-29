import { randomUUID } from 'crypto';
import { describe, expect, it, vi } from 'vitest';
import type { Model } from 'mongoose';

import { CharacterId } from '../../domain/character-id';
import type { JournalChapterDocument } from './journal-chapter.mapper';
import { MongoJournalChapterRepository } from './mongo-journal-chapter.repository';

describe('MongoJournalChapterRepository', () => {
  it('lit le sommaire sans jamais charger les textes', async () => {
    const summary = {
      id: randomUUID(), title: 'La taverne', position: 0, revision: 2,
      updatedAt: '2026-09-29T10:00:00.000Z',
    };
    const query = {
      sort: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      lean: vi.fn(async () => [{ ...summary, characterId: 'ignoré' }]),
    };
    const model = { find: vi.fn(() => query) } as unknown as Model<JournalChapterDocument>;

    const summaries = await new MongoJournalChapterRepository(model)
      .listSummariesByCharacter(CharacterId.create(randomUUID()));

    expect(query.select.mock.calls[0]?.[0]).not.toHaveProperty('body');
    expect(query.select.mock.calls[0]?.[0]).toMatchObject({ _id: 0 });
    expect(summaries).toEqual([summary]);
  });
});
