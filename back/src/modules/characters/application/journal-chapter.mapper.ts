import type {
  JournalChapter as JournalChapterDto,
  JournalChapterCommandResult,
  JournalChapterSummary,
} from '@donjon-dragon/shared/character-journal-schema';

import type { JournalChapter } from '../domain/journal-chapter';

export function toJournalChapterSummaryDto(chapter: JournalChapter): JournalChapterSummary {
  return {
    id: chapter.id.value,
    title: chapter.title,
    revision: chapter.revision,
    updatedAt: chapter.updatedAt,
  };
}

export function toJournalChapterDto(chapter: JournalChapter): JournalChapterDto {
  return { ...toJournalChapterSummaryDto(chapter), body: chapter.body };
}

/** Ce que retient le reçu : ni titre ni texte. */
export function toJournalChapterCommandResult(
  chapter: JournalChapter,
): JournalChapterCommandResult {
  return { id: chapter.id.value, revision: chapter.revision, updatedAt: chapter.updatedAt };
}
