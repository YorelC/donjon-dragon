import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { CampaignSummary } from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { commandHeaders } from "@/shared/api/idempotency";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { MY_CAMPAIGNS_KEY } from "./use-my-campaigns";

/**
 * Le serveur rend le résumé de la campagne créée : on l'écrit directement dans le
 * cache de la liste plutôt que de tout recharger pour une ligne connue.
 */
function handleSuccess(queryClient: QueryClient, campaign: CampaignSummary) {
  queryClient.setQueryData<CampaignSummary[]>(MY_CAMPAIGNS_KEY, (old) => [
    ...(old ?? []),
    campaign,
  ]);
  toast.success(`Campagne « ${campaign.name} » créée`);
}

function handleError() {
  toast.error("Impossible de créer la campagne");
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) =>
      api.post<CampaignSummary>(
        API_ROUTES.campaigns.create,
        { name },
        commandHeaders(),
      ),
    onSuccess: (campaign) => handleSuccess(queryClient, campaign),
    onError: handleError,
  });
}
