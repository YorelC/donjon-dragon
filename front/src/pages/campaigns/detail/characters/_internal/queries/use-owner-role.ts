import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { campaignDetailKey } from "@/shared/queries/use-campaign-detail";

export function useSelfPromoteOwner(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post(API_ROUTES.campaigns.selfPromote(campaignId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignDetailKey(campaignId) });
      toast.success("Tu es maintenant maître du jeu");
    },
    onError: () => toast.error("Impossible de te promouvoir"),
  });
}

export function useSelfDemoteOwner(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post(API_ROUTES.campaigns.selfDemote(campaignId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignDetailKey(campaignId) });
      toast.success("Tu es redevenu joueur");
    },
    onError: () =>
      toast.error("Il doit rester au moins un autre maître du jeu dans la campagne"),
  });
}
