import { DOMAIN_ERROR_CODE, type JournalChapter } from "@donjon-dragon/shared";
import { ApiError } from "@/shared/api/api";
import type { ChapterDraft, SaveStatus } from "../types/journal";

export function draftOf(chapter: Pick<JournalChapter, "title" | "body">): ChapterDraft {
  return { title: chapter.title, body: chapter.body };
}

export function sameDraft(left: ChapterDraft, right: ChapterDraft): boolean {
  return left.title === right.title && left.body === right.body;
}

/** Seul le refus « modifié ailleurs » ouvre le choix entre les deux versions. */
export function failureStatusOf(error: unknown): SaveStatus {
  const modifiedElsewhere =
    error instanceof ApiError && error.code === DOMAIN_ERROR_CODE["journal-chapter-modified-elsewhere"];
  return modifiedElsewhere ? "conflict" : "failed";
}
