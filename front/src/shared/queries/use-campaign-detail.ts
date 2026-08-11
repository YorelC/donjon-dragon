import { useQuery } from "@tanstack/react-query";
import type { CampaignDetail } from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";

/**
 * Clé par campagne : deux détails ouverts tour à tour ne doivent pas se recouvrir.
 * Toute mutation de membre ou de propriété l'invalide.
 */
export const campaignDetailKey = (campaignId: string) =>
  ["campaigns", "detail", campaignId] as const;

export function useCampaignDetail(campaignId: string) {
  return useQuery({
    queryKey: campaignDetailKey(campaignId),
    queryFn: () => api.get<CampaignDetail>(API_ROUTES.campaigns.detail(campaignId)),
    retry: false,
  });
}
