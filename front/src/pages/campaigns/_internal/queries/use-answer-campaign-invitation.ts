import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { CAMPAIGN_INVITATIONS_KEY } from "./use-campaign-invitations";
import { MY_CAMPAIGNS_KEY } from "./use-my-campaigns";

/**
 * Accepter et refuser ne diffèrent que par leur route et leur message : deux
 * fichiers auraient dupliqué l'invalidation, qui est la partie qui compte.
 * Le serveur répond 204, il n'y a donc rien à écrire dans le cache — on
 * réinvalide, ce que la clé préfixe fait aussi pour le badge.
 */
function invalidateInvitations(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: CAMPAIGN_INVITATIONS_KEY });
  queryClient.invalidateQueries({ queryKey: MY_CAMPAIGNS_KEY });
}

export function useAcceptCampaignInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: string) =>
      api.post<void>(API_ROUTES.campaigns.acceptInvitation(campaignId), {}),
    onSuccess: () => {
      invalidateInvitations(queryClient);
      toast.success("Tu as rejoint la campagne");
    },
    onError: () => toast.error("Impossible de rejoindre la campagne"),
  });
}

export function useRefuseCampaignInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: string) =>
      api.post<void>(API_ROUTES.campaigns.refuseInvitation(campaignId), {}),
    onSuccess: () => {
      invalidateInvitations(queryClient);
      toast.success("Demande refusée");
    },
    onError: () => toast.error("Impossible de refuser la demande"),
  });
}
