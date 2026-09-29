import { Schema } from 'mongoose';

import type { JournalChapterSnapshot } from '../../domain/journal-chapter';

export const JOURNAL_CHAPTER_MODEL = 'JournalChapter';
export const JOURNAL_CHAPTER_COLLECTION = 'character_journal_chapters';

export const JournalChapterSchema = new Schema<JournalChapterSnapshot>(
  {
    id: { type: String, required: true, unique: true },
    campaignId: { type: String, required: true },
    characterId: { type: String, required: true },
    title: { type: String, default: '' },
    body: { type: String, default: '' },
    position: { type: Number, required: true, min: 0 },
    revision: { type: Number, required: true, min: 0 },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { collection: JOURNAL_CHAPTER_COLLECTION, versionKey: false },
);

/** Le sommaire d'un journal, dans son ordre ; et la purge d'une campagne. */
JournalChapterSchema.index({ characterId: 1, position: 1 });
JournalChapterSchema.index({ campaignId: 1 });
