import { useQuery } from "@tanstack/react-query";
import type { CampaignSummary } from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";

/** Exportée : la mutation de création écrit dans ce cache sans refetch. */
export const MY_CAMPAIGNS_KEY = ["campaigns", "mine"] as const;

export function useMyCampaigns() {
  return useQuery({
    queryKey: MY_CAMPAIGNS_KEY,
    queryFn: () => api.get<CampaignSummary[]>(API_ROUTES.campaigns.list),
    retry: false,
  });
}
