import { GripVertical, Plus } from "lucide-react";
import type { JournalChapterSummary } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import {
  SortableHandle,
  SortableItem,
  SortableList,
} from "@/shared/components/atoms/sortable-list";
import { Diamond } from "@/shared/components/molecules/diamond";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import { cn } from "@/shared/utils/utils";
import { JOURNAL_LABELS } from "../constants/journal-labels";
import type { JournalTab } from "../hooks/use-journal-tab";
import type { JournalSelection } from "../hooks/use-journal-selection";
import { chapterNameOf, displayTitle } from "../utils/journal-chapters";

/** Le sommaire : l'auteur l'ordonne à la poignée, un lecteur ne fait que choisir. */
export function JournalChapterListView({ journal }: { journal: JournalTab }) {
  return (
    <nav aria-label={JOURNAL_LABELS.chapters} className="journal-contents">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <SectionHeading label={JOURNAL_LABELS.chapters} />
        </div>
        {journal.canWrite ? <NewChapterButton journal={journal} /> : null}
      </div>
      <ChapterList journal={journal} />
    </nav>
  );
}

function NewChapterButton({ journal }: { journal: JournalTab }) {
  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label={JOURNAL_LABELS.newChapter}
      title={journal.full ? JOURNAL_LABELS.journalFull : JOURNAL_LABELS.newChapter}
      disabled={journal.creating || journal.full}
      onClick={journal.create}
    >
      <Plus />
    </Button>
  );
}

function ChapterList({ journal }: { journal: JournalTab }) {
  if (journal.chapters.length === 0) return <EmptyJournal canWrite={journal.canWrite} />;
  if (!journal.canWrite) return <ReadOnlyChapterList journal={journal} />;

  return (
    <SortableList
      ids={journal.chapters.map((chapter) => chapter.id)}
      onReorder={journal.reorder}
      nameOf={chapterNameOf(journal.chapters)}
      className="journal-chapter-list"
    >
      {journal.chapters.map((chapter) => (
        <SortableChapterRow key={chapter.id} chapter={chapter} selection={journal.selection} />
      ))}
    </SortableList>
  );
}

function ReadOnlyChapterList({ journal }: { journal: JournalTab }) {
  return (
    <ul className="journal-chapter-list">
      {journal.chapters.map((chapter) => (
        <li key={chapter.id} className="journal-chapter-row">
          <ChapterButton chapter={chapter} selection={journal.selection} />
        </li>
      ))}
    </ul>
  );
}

interface ChapterRowProps {
  chapter: JournalChapterSummary;
  selection: JournalSelection;
}

function SortableChapterRow({ chapter, selection }: ChapterRowProps) {
  return (
    <SortableItem id={chapter.id} className="journal-chapter-row">
      <SortableHandle
        aria-label={`${JOURNAL_LABELS.move} ${displayTitle(chapter.title)}`}
        className="journal-chapter-handle"
      >
        <GripVertical className="size-3.5" />
      </SortableHandle>
      <ChapterButton chapter={chapter} selection={selection} />
    </SortableItem>
  );
}

function ChapterButton({ chapter, selection }: ChapterRowProps) {
  const open = chapter.id === selection.selectedId;

  return (
    <button
      type="button"
      aria-current={open ? "true" : undefined}
      onClick={() => selection.select(chapter.id)}
      className={cn("journal-chapter-button selectable", open && "selectable-on")}
    >
      <Diamond size="tick" tone={open ? "filled" : "idle"} />
      <span className="truncate">{displayTitle(chapter.title)}</span>
    </button>
  );
}

function EmptyJournal({ canWrite }: { canWrite: boolean }) {
  const message = canWrite ? JOURNAL_LABELS.emptyForWriter : JOURNAL_LABELS.emptyForReader;
  return <p className="empty-state-text">{message}</p>;
}
