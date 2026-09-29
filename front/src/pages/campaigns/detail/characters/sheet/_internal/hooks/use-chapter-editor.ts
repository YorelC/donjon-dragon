import { useState } from "react";
import type { JournalChapter } from "@donjon-dragon/shared";
import { useDeleteJournalChapter } from "../queries/use-journal-mutations";
import type { ChapterLock, ChapterTarget } from "../types/journal";
import { useChapterAutosave, type ChapterAutosave } from "./use-chapter-autosave";

export interface ChapterLockToggle {
  locked: boolean;
  toggle: () => void;
}

export interface ChapterEditor {
  autosave: ChapterAutosave;
  lock: ChapterLockToggle;
  remove: () => void;
}

export interface ChapterEditorInput {
  target: ChapterTarget;
  chapter: JournalChapter;
  initialLock: ChapterLock;
}

export function useChapterEditor({ target, chapter, initialLock }: ChapterEditorInput): ChapterEditor {
  const autosave = useChapterAutosave(target, chapter);
  const lock = useChapterLock(initialLock, autosave.flush);
  const deletion = useDeleteJournalChapter(target);

  return { autosave, lock, remove: () => deletion.mutate() };
}

/** Verrouiller enregistre aussitôt : on ne quitte pas l'écriture sur un brouillon en attente. */
function useChapterLock(initialLock: ChapterLock, onLock: () => void): ChapterLockToggle {
  const [lock, setLock] = useState(initialLock);
  const locked = lock === "locked";
  const toggle = () => {
    if (!locked) onLock();
    setLock(locked ? "unlocked" : "locked");
  };
  return { locked, toggle };
}
