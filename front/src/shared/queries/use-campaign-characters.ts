import { useQuery } from "@tanstack/react-query";
import type { Character } from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";

/**
 * Remonté de `pages/campaigns/detail/characters/_internal/` : la liste sert
 * maintenant à deux pages — celle de la table, et le wizard, qui y lit le nom et
 * le tirage du brouillon qu'il est en train de remplir.
 */
export const campaignCharactersKey = (campaignId: string) =>
  ["campaigns", "characters", campaignId] as const;

export function useCampaignCharacters(campaignId: string) {
  return useQuery({
    queryKey: campaignCharactersKey(campaignId),
    queryFn: () => api.get<Character[]>(API_ROUTES.characters.list(campaignId)),
    retry: false,
  });
}
