import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  CharacterJournal,
  JournalChapterCommandResult,
  JournalReorderResult,
  UpdateJournalChapterDto,
} from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { commandHeaders } from "@/shared/api/idempotency";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { JOURNAL_LABELS } from "../constants/journal-labels";
import type { ChapterTarget, JournalTarget } from "../types/journal";
import { characterJournalKey, journalChapterKey } from "./use-character-journal";

export function useCreateJournalChapter(target: JournalTarget) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) =>
      api.post<JournalChapterCommandResult>(
        API_ROUTES.characters.journalChapters(target.campaignId, target.characterId),
        { title }, commandHeaders(),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: characterJournalKey(target) }),
    onError: () => toast.error(JOURNAL_LABELS.createFailed),
  });
}

/** La sauvegarde automatique : sans toast, l'en-tête du chapitre en rend compte. */
export function putJournalChapter(target: ChapterTarget, body: UpdateJournalChapterDto) {
  return api.put<JournalChapterCommandResult>(
    API_ROUTES.characters.journalChapter(target.campaignId, target.characterId, target.chapterId),
    body, commandHeaders(),
  );
}

export function putJournalChapterOnExit(target: ChapterTarget, body: UpdateJournalChapterDto) {
  return api.putOnExit<JournalChapterCommandResult>(
    API_ROUTES.characters.journalChapter(target.campaignId, target.characterId, target.chapterId),
    body, commandHeaders(),
  );
}

/** Le sommaire suit le titre enregistré, sans relire tout le journal. */
export function recordSavedChapter(
  queryClient: QueryClient,
  target: ChapterTarget,
  saved: JournalChapterCommandResult & { title: string; body: string },
) {
  queryClient.setQueryData<CharacterJournal>(characterJournalKey(target), (journal) =>
    journal && {
      ...journal,
      chapters: journal.chapters.map((chapter) =>
        chapter.id === saved.id ? { ...chapter, ...saved } : chapter),
    });
  queryClient.setQueryData(journalChapterKey(target), saved);
}

export function useDeleteJournalChapter(target: ChapterTarget) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.delete(
        API_ROUTES.characters.journalChapter(target.campaignId, target.characterId, target.chapterId),
        commandHeaders(),
      ),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: journalChapterKey(target) });
      queryClient.invalidateQueries({ queryKey: characterJournalKey(target) });
      toast.success(JOURNAL_LABELS.deleted);
    },
    onError: () => toast.error(JOURNAL_LABELS.deleteFailed),
  });
}

/** Optimiste : la ligne lâchée reste où on l'a posée pendant l'aller-retour. */
export function useReorderJournalChapters(target: JournalTarget) {
  const queryClient = useQueryClient();
  const key = characterJournalKey(target);
  return useMutation({
    mutationFn: (chapterIds: string[]) =>
      api.put<JournalReorderResult>(
        API_ROUTES.characters.journalOrder(target.campaignId, target.characterId),
        { chapterIds }, commandHeaders(),
      ),
    onMutate: (chapterIds) =>
      queryClient.setQueryData<CharacterJournal>(key, (journal) =>
        journal && { ...journal, chapters: inOrder(journal, chapterIds) }),
    onError: () => toast.error(JOURNAL_LABELS.reorderFailed),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

function inOrder(journal: CharacterJournal, chapterIds: string[]) {
  return chapterIds.flatMap((id) => journal.chapters.filter((chapter) => chapter.id === id));
}
