import type { JournalChapterSummary } from "@donjon-dragon/shared";
import { JOURNAL_LABELS } from "../constants/journal-labels";

/** Un chapitre sans titre se nomme « Sans titre », partout où il se lit. */
export function displayTitle(title: string): string {
  return title || JOURNAL_LABELS.untitled;
}

/** Le nom d'un chapitre du sommaire, retrouvé par son identifiant. */
export function chapterNameOf(chapters: readonly JournalChapterSummary[]) {
  return (chapterId: string) =>
    displayTitle(chapters.find((chapter) => chapter.id === chapterId)?.title ?? "");
}
