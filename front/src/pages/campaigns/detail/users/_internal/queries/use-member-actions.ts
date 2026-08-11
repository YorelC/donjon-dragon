import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { campaignDetailKey } from "@/shared/queries/use-campaign-detail";

/**
 * Promouvoir, rétrograder et retirer ne diffèrent que par leur route et leur
 * message. Le serveur répond 204 : il n'y a rien à écrire dans le cache, on
 * recharge le détail, qui est la seule vue concernée.
 */
function refreshDetail(queryClient: QueryClient, campaignId: string) {
  queryClient.invalidateQueries({ queryKey: campaignDetailKey(campaignId) });
}

export function usePromoteMember(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayName: string) =>
      api.post<void>(API_ROUTES.campaigns.promoteMember(campaignId, displayName), {}),
    onSuccess: (_data, displayName) => {
      refreshDetail(queryClient, campaignId);
      toast.success(`${displayName} est maintenant maître du jeu`);
    },
    onError: () => toast.error("Impossible de promouvoir ce joueur"),
  });
}

export function useDemoteMember(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayName: string) =>
      api.post<void>(API_ROUTES.campaigns.demoteMember(campaignId, displayName), {}),
    onSuccess: (_data, displayName) => {
      refreshDetail(queryClient, campaignId);
      toast.success(`${displayName} est redevenu joueur`);
    },
    onError: () => toast.error("Impossible de rétrograder ce maître du jeu"),
  });
}

export function useRemoveMember(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayName: string) =>
      api.delete<void>(API_ROUTES.campaigns.removeMember(campaignId, displayName)),
    onSuccess: (_data, displayName) => {
      refreshDetail(queryClient, campaignId);
      toast.success(`${displayName} ne fait plus partie de la campagne`);
    },
    onError: () => toast.error("Impossible de retirer ce membre"),
  });
}
