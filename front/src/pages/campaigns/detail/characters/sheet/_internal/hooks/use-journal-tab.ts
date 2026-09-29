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
  const creation = useChapterCreation(target, selection);
  const reorder = useReorderJournalChapters(target);

  return {
    target, chapters,
    selection: { selectedId: selection.selectedId, select: creation.select },
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

/**
 * Le chapitre créé s'ouvre aussitôt, et lui seul s'ouvre déverrouillé ; choisir
 * un autre chapitre le rend ordinaire : il se rouvrira verrouillé.
 */
function useChapterCreation(target: JournalTarget, selection: JournalSelection) {
  const [createdId, setCreatedId] = useState<string | null>(null);
  const mutation = useCreateJournalChapter(target);
  const select = (chapterId: string) => {
    if (chapterId !== createdId) setCreatedId(null);
    selection.select(chapterId);
  };
  const create = () =>
    mutation.mutate(NEW_CHAPTER_TITLE, {
      onSuccess: ({ id }) => {
        setCreatedId(id);
        selection.select(id);
      },
    });
  return { createdId, create, select, pending: mutation.isPending };
}
