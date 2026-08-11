import { useQuery } from "@tanstack/react-query";
import type { PendingCampaignInvitationCount } from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { CAMPAIGN_INVITATIONS_KEY } from "./use-campaign-invitations";

export const INVITATION_COUNT_KEY = [
  ...CAMPAIGN_INVITATIONS_KEY,
  "count",
] as const;

/**
 * Le badge est affiché en permanence : un staleTime évite de le recharger à
 * chaque montage, et les mutations l'invalident quand il devient faux.
 */
const COUNT_STALE_TIME_MS = 30_000;

export function useInvitationCount() {
  return useQuery({
    queryKey: INVITATION_COUNT_KEY,
    queryFn: () =>
      api.get<PendingCampaignInvitationCount>(
        API_ROUTES.campaigns.invitationsCount,
      ),
    staleTime: COUNT_STALE_TIME_MS,
    retry: false,
  });
}
