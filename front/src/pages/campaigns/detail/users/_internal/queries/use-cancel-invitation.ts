import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/shared/api/api";
import { commandHeaders } from "@/shared/api/idempotency";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { campaignDetailKey } from "@/shared/queries/use-campaign-detail";

/**
 * Annuler une invitation ouverte n'est PAS retirer un membre : la cible n'a jamais
 * rejoint la campagne, et la route de retrait des membres refuserait un pseudo qui
 * n'y figure pas. D'où un fichier à part de `use-member-actions`.
 */
export function useCancelInvitation(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayName: string) =>
      api.delete<void>(
        API_ROUTES.campaigns.cancelInvitation(campaignId, displayName),
        commandHeaders(),
      ),
    onSuccess: (_data, displayName) => {
      queryClient.invalidateQueries({ queryKey: campaignDetailKey(campaignId) });
      toast.success(`Invitation de ${displayName} annulée`);
    },
    onError: () => toast.error("Impossible d'annuler cette invitation"),
  });
}
