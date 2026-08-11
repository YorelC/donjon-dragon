import { useQuery } from "@tanstack/react-query";
import type { CampaignInvitation } from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";

/**
 * Clé PRÉFIXE de celle du compteur : invalider les invitations rafraîchit le
 * badge sans qu'aucune mutation ait à connaître les deux clés.
 */
export const CAMPAIGN_INVITATIONS_KEY = ["campaigns", "invitations"] as const;

export function useCampaignInvitations() {
  return useQuery({
    queryKey: CAMPAIGN_INVITATIONS_KEY,
    queryFn: () =>
      api.get<CampaignInvitation[]>(API_ROUTES.campaigns.invitations),
    retry: false,
  });
}
