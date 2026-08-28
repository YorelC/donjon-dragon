import { useQuery } from "@tanstack/react-query";
import type { PendingCampaignInvitationCount } from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";

/**
 * La clé est écrite en dur, et non dérivée de `CAMPAIGN_INVITATIONS_KEY` : celle-ci
 * vit dans le `_internal` de la page Campagnes, que `shared/` n'a pas le droit de
 * connaître. C'est le test de la mutation qui garde les deux clés emboîtées.
 */
export const CAMPAIGN_INVITATION_COUNT_KEY = [
  "campaigns",
  "invitations",
  "count",
] as const;

/**
 * Le badge est affiché en permanence : un staleTime évite de le recharger à
 * chaque montage, et les mutations l'invalident quand il devient faux.
 */
const COUNT_STALE_TIME_MS = 30_000;

export function useCampaignInvitationCount() {
  return useQuery({
    queryKey: CAMPAIGN_INVITATION_COUNT_KEY,
    queryFn: () =>
      api.get<PendingCampaignInvitationCount>(
        API_ROUTES.campaigns.invitationsCount,
      ),
    staleTime: COUNT_STALE_TIME_MS,
    retry: false,
  });
}
