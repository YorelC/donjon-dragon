import { useJournalChapter } from "../queries/use-character-journal";
import type { ChapterOpening } from "../types/journal";
import { JournalChapterPaneView } from "../views/journal-chapter-pane.view";

/** Charge le chapitre ouvert ; l'éditeur ne naît qu'une fois sa version connue. */
export function JournalChapterContainer({ opening }: { opening: ChapterOpening }) {
  const chapter = useJournalChapter(opening.target);

  return (
    <JournalChapterPaneView
      opening={opening}
      chapter={{ data: chapter.data ?? null, loading: chapter.isLoading, error: chapter.isError }}
    />
  );
}
