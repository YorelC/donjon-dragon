import { useEffect, useRef, useState } from "react";
import type { JournalChapter } from "@donjon-dragon/shared";
import { AUTOSAVE_DELAY_MS } from "../constants/journal-labels";
import type { ChapterDraft, ChapterTarget, SaveStatus } from "../types/journal";
import { draftOf } from "../utils/journal-draft";
import { useChapterSync, type ChapterSync } from "./use-chapter-sync";

export interface ChapterAutosave {
  draft: ChapterDraft;
  status: SaveStatus;
  setTitle: (title: string) => void;
  setBody: (body: string) => void;
  flush: () => void;
  takeTheirs: () => void;
  keepMine: () => void;
}

/**
 * Le brouillon du chapitre ouvert, enregistré seul après une pause de frappe et
 * à la fermeture du chapitre. Il naît de la version chargée à l'ouverture, et
 * seul le choix « prendre l'autre version » le remplace ensuite.
 */
export function useChapterAutosave(target: ChapterTarget, chapter: JournalChapter): ChapterAutosave {
  const [draft, setDraft] = useState(() => draftOf(chapter));
  const sync = useChapterSync(target, chapter);
  useFlushAfterPause(draft, sync);
  useFlushOnClose(draft, sync);

  return {
    draft,
    status: sync.status,
    setTitle: (title) => setDraft((current) => ({ ...current, title })),
    setBody: (body) => setDraft((current) => ({ ...current, body })),
    flush: () => sync.flush(draft),
    takeTheirs: () => void sync.takeTheirs().then(setDraft),
    keepMine: () => void sync.keepMine(draft),
  };
}

// Relancé aussi quand une sauvegarde se termine : ce qui a été tapé pendant
// qu'elle était en vol part à son tour. `flush` lit ses refs, le statut suffit.
function useFlushAfterPause(draft: ChapterDraft, sync: ChapterSync): void {
  useEffect(() => {
    const timer = setTimeout(() => sync.flush(draft), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft, sync.status]);
}

/** Changer de chapitre ou d'onglet démonte l'éditeur : ce qui reste part à ce moment-là. */
function useFlushOnClose(draft: ChapterDraft, sync: ChapterSync): void {
  const latest = useRef({ draft, sync });
  useEffect(() => {
    latest.current = { draft, sync };
  });
  useEffect(() => () => latest.current.sync.flush(latest.current.draft), []);
}
