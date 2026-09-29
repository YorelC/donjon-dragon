import { JournalChapter, type JournalChapterSnapshot } from '../../domain/journal-chapter';

export type JournalChapterDocument = JournalChapterSnapshot;

export function toJournalChapter(document: JournalChapterDocument): JournalChapter {
  return JournalChapter.restore(document);
}

export function toJournalChapterDocument(chapter: JournalChapter): JournalChapterDocument {
  return chapter.snapshot();
}
