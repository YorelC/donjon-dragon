import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { campaignDetailKey } from "@/shared/queries/use-campaign-detail";

/**
 * Le successeur voyage AVEC le départ : le serveur déplace la propriété et retire
 * le partant en une écriture. En deux appels, un échec du second laisserait la
 * campagne à quelqu'un d'autre avec le partant encore dedans.
 */
export function useLeaveCampaign(campaignId: string) {
  return useMutation({
    mutationFn: (successorDisplayName: string | null) =>
      api.post<void>(
        API_ROUTES.campaigns.leave(campaignId),
        successorDisplayName ? { successorDisplayName } : {},
      ),
    onSuccess: () => toast.success("Tu as quitté la campagne"),
    onError: () => toast.error("Impossible de quitter la campagne"),
  });
}

export function useDeleteCampaign(campaignId: string) {
  return useMutation({
    mutationFn: () => api.delete<void>(API_ROUTES.campaigns.remove(campaignId)),
    onSuccess: () => toast.success("Campagne supprimée"),
    onError: () => toast.error("Impossible de supprimer la campagne"),
  });
}

export function useTransferOwnership(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayName: string) =>
      api.post<void>(API_ROUTES.campaigns.owner(campaignId), { displayName }),
    onSuccess: (_data, displayName) => {
      queryClient.invalidateQueries({ queryKey: campaignDetailKey(campaignId) });
      toast.success(`${displayName} est maintenant propriétaire de la campagne`);
    },
    onError: () => toast.error("Impossible de transférer la propriété"),
  });
}
