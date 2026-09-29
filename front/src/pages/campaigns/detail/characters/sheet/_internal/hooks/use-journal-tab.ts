import { useState } from "react";
import { CHARACTER_JOURNAL_RULES, type JournalChapterSummary } from "@donjon-dragon/shared";
import { useCharacterJournal } from "../queries/use-character-journal";
import {
  useCreateJournalChapter,
  useReorderJournalChapters,
} from "../queries/use-journal-mutations";
import type { ChapterLock, JournalTarget } from "../types/journal";
import { useJournalSelection, type JournalSelection } from "./use-journal-selection";

export interface JournalTab {
  target: JournalTarget;
  chapters: JournalChapterSummary[];
  canWrite: boolean;
  loading: boolean;
  error: boolean;
  selection: JournalSelection;
  lockOf: (chapterId: string) => ChapterLock;
  create: () => void;
  creating: boolean;
  full: boolean;
  reorder: (chapterIds: string[]) => void;
}

const NEW_CHAPTER_TITLE = "";

export function useJournalTab(target: JournalTarget): JournalTab {
  const journal = useCharacterJournal(target);
  const chapters = journal.data?.chapters ?? [];
  const selection = useJournalSelection(chapters.map((chapter) => chapter.id));
  const creation = useChapterCreation(target, selection.select);
  const reorder = useReorderJournalChapters(target);

  return {
    target, chapters, selection,
    canWrite: journal.data?.canWrite ?? false,
    loading: journal.isLoading,
    error: journal.isError,
    lockOf: (chapterId) => (chapterId === creation.createdId ? "unlocked" : "locked"),
    create: creation.create,
    creating: creation.pending,
    full: chapters.length >= CHARACTER_JOURNAL_RULES.maxChapters,
    reorder: (chapterIds) => reorder.mutate(chapterIds),
  };
}

/** Le chapitre créé s'ouvre aussitôt, et lui seul s'ouvre déverrouillé. */
function useChapterCreation(target: JournalTarget, open: (chapterId: string) => void) {
  const [createdId, setCreatedId] = useState<string | null>(null);
  const mutation = useCreateJournalChapter(target);
  const create = () =>
    mutation.mutate(NEW_CHAPTER_TITLE, {
      onSuccess: ({ id }) => {
        setCreatedId(id);
        open(id);
      },
    });
  return { createdId, create, pending: mutation.isPending };
}
