import { useQuery } from "@tanstack/react-query";
import type { ComputedCharacter } from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";

export const characterSheetKey = (campaignId: string, characterId: string) =>
  ["campaigns", "characters", campaignId, characterId, "sheet"] as const;

/**
 * La fiche est recalculée par le serveur à chaque lecture : elle n'est jamais
 * stockée. Pas de `staleTime` — un changement d'équipement doit se voir.
 */
export function useCharacterSheet(campaignId: string, characterId: string) {
  return useQuery({
    queryKey: characterSheetKey(campaignId, characterId),
    queryFn: () =>
      api.get<ComputedCharacter>(API_ROUTES.characters.sheet(campaignId, characterId)),
    retry: false,
  });
}
