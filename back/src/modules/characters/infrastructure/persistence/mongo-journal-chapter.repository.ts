import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import type {
  JournalChapterRepositoryPort,
  JournalChapterSummaryRecord,
} from '../../application/ports/journal-chapter.repository.port';
import type { CharacterId } from '../../domain/character-id';
import type { JournalChapter } from '../../domain/journal-chapter';
import type { JournalChapterId } from '../../domain/journal-chapter-id';
import { toJournalChapter, type JournalChapterDocument } from './journal-chapter.mapper';
import { JOURNAL_CHAPTER_MODEL } from './journal-chapter.schema';

// Deux créations simultanées peuvent partager une position : la date les départage.
const JOURNAL_ORDER = { position: 1, createdAt: 1 } as const;
const SUMMARY_FIELDS = { _id: 0, id: 1, title: 1, position: 1, revision: 1, updatedAt: 1 } as const;

@Injectable()
export class MongoJournalChapterRepository implements JournalChapterRepositoryPort {
  constructor(
    @InjectModel(JOURNAL_CHAPTER_MODEL) private readonly model: Model<JournalChapterDocument>,
  ) {}

  async listByCharacter(characterId: CharacterId): Promise<JournalChapter[]> {
    const documents = await this.model
      .find({ characterId: characterId.value })
      .sort(JOURNAL_ORDER)
      .select('-_id')
      .lean<JournalChapterDocument[]>();
    return documents.map(toJournalChapter);
  }

  async listSummariesByCharacter(characterId: CharacterId): Promise<JournalChapterSummaryRecord[]> {
    const documents = await this.model
      .find({ characterId: characterId.value })
      .sort(JOURNAL_ORDER)
      .select(SUMMARY_FIELDS)
      .lean<JournalChapterSummaryRecord[]>();
    return documents.map(toSummaryRecord);
  }

  async findByCharacterAndId(
    characterId: CharacterId,
    id: JournalChapterId,
  ): Promise<JournalChapter | null> {
    const document = await this.model
      .findOne({ id: id.value, characterId: characterId.value })
      .select('-_id')
      .lean<JournalChapterDocument>();
    return document ? toJournalChapter(document) : null;
  }
}

function toSummaryRecord(document: JournalChapterSummaryRecord): JournalChapterSummaryRecord {
  const { id, title, position, revision, updatedAt } = document;
  return { id, title, position, revision, updatedAt };
}
