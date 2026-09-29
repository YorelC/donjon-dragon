import type {
  JournalChapter as JournalChapterDto,
  JournalChapterCommandResult,
  JournalChapterSummary,
} from '@donjon-dragon/shared/character-journal-schema';

import type { JournalChapterSummaryRecord } from './ports/journal-chapter.repository.port';
import type { JournalChapter } from '../domain/journal-chapter';

export function toJournalChapterSummaryDto(
  record: JournalChapterSummaryRecord,
): JournalChapterSummary {
  return { id: record.id, title: record.title, revision: record.revision, updatedAt: record.updatedAt };
}

export function toJournalChapterDto(chapter: JournalChapter): JournalChapterDto {
  return {
    id: chapter.id.value, title: chapter.title, body: chapter.body,
    revision: chapter.revision, updatedAt: chapter.updatedAt,
  };
}

/** Ce que retient le reçu : ni titre ni texte. */
export function toJournalChapterCommandResult(
  chapter: JournalChapter,
): JournalChapterCommandResult {
  return { id: chapter.id.value, revision: chapter.revision, updatedAt: chapter.updatedAt };
}
