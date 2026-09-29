import type { JournalChapter } from "@donjon-dragon/shared";
import { useChapterEditor } from "../hooks/use-chapter-editor";
import type { ChapterOpening } from "../types/journal";
import { JournalChapterEditorView } from "../views/journal-chapter-editor.view";

interface JournalChapterEditorContainerProps {
  opening: ChapterOpening;
  chapter: JournalChapter;
}

export function JournalChapterEditorContainer({ opening, chapter }: JournalChapterEditorContainerProps) {
  const editor = useChapterEditor({ target: opening.target, chapter, initialLock: opening.initialLock });

  return <JournalChapterEditorView editor={editor} canWrite={opening.canWrite} />;
}
