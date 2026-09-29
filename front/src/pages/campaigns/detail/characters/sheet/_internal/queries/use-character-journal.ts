import { useQuery } from "@tanstack/react-query";
import type { CharacterJournal, JournalChapter } from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import type { ChapterTarget, JournalTarget } from "../types/journal";

export const characterJournalKey = ({ campaignId, characterId }: JournalTarget) =>
  ["campaigns", "characters", campaignId, characterId, "journal"] as const;

export const journalChapterKey = (target: ChapterTarget) =>
  [...characterJournalKey(target), "chapters", target.chapterId] as const;

/** Le sommaire du journal, sans les textes, et si l'appelant peut l'écrire. */
export function useCharacterJournal(target: JournalTarget) {
  return useQuery({
    queryKey: characterJournalKey(target),
    queryFn: () =>
      api.get<CharacterJournal>(API_ROUTES.characters.journal(target.campaignId, target.characterId)),
    retry: false,
  });
}

export function fetchJournalChapter({ campaignId, characterId, chapterId }: ChapterTarget) {
  return api.get<JournalChapter>(
    API_ROUTES.characters.journalChapter(campaignId, characterId, chapterId),
  );
}

/**
 * Relu à chaque ouverture : un MJ doit voir la dernière version enregistrée. Le
 * brouillon d'un chapitre ouvert ne vient de cette query qu'une fois, à son
 * ouverture, donc une relecture ne l'écrase jamais.
 */
export function useJournalChapter(target: ChapterTarget) {
  return useQuery({
    queryKey: journalChapterKey(target),
    queryFn: () => fetchJournalChapter(target),
    retry: false,
  });
}
