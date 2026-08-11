import { useQuery } from "@tanstack/react-query";
import type { Character } from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";

export const campaignCharactersKey = (campaignId: string) =>
  ["campaigns", "characters", campaignId] as const;

export function useCampaignCharacters(campaignId: string) {
  return useQuery({
    queryKey: campaignCharactersKey(campaignId),
    queryFn: () => api.get<Character[]>(API_ROUTES.characters.list(campaignId)),
    retry: false,
  });
}
