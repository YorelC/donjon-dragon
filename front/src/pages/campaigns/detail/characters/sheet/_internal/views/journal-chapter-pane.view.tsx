import type { JournalChapter } from "@donjon-dragon/shared";
import type { QueryState } from "@/shared/types/ui-state";
import { JournalChapterEditorContainer } from "../containers/journal-chapter-editor.container";
import { JOURNAL_LABELS } from "../constants/journal-labels";
import type { ChapterOpening } from "../types/journal";

interface JournalChapterPaneViewProps {
  opening: ChapterOpening;
  chapter: QueryState<JournalChapter | null>;
}

export function JournalChapterPaneView({ opening, chapter }: JournalChapterPaneViewProps) {
  if (chapter.data) return <JournalChapterEditorContainer opening={opening} chapter={chapter.data} />;

  const message = chapter.error ? JOURNAL_LABELS.loadFailed : JOURNAL_LABELS.loading;
  return (
    <section className="journal-chapter">
      <p className="empty-state-text">{message}</p>
    </section>
  );
}
