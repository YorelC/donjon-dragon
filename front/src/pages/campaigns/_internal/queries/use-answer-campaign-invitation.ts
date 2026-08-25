import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/shared/api/api";
import { commandHeaders } from "@/shared/api/idempotency";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { CAMPAIGN_INVITATIONS_KEY } from "./use-campaign-invitations";
import { MY_CAMPAIGNS_KEY } from "./use-my-campaigns";

/**
 * Le serveur masque en 404 une invitation absente, terminale ou destinée à
 * quelqu'un d'autre : le message reste donc le même dans les trois cas, sinon il
 * dirait à l'acteur ce qu'il n'a pas le droit de savoir.
 */
const ACCEPT_FALLBACK_ERROR = "Impossible de rejoindre la campagne";
const REFUSE_FALLBACK_ERROR = "Impossible de refuser la demande";

const ANSWER_ERROR_MESSAGES: Record<number, string> = {
  403: "Tu ne peux pas répondre à cette invitation.",
  404: "Cette invitation n'est plus disponible.",
  409: "Cette invitation a déjà été traitée.",
};

/** Exportée pour être testée directement : c'est une fonction pure. */
export function toAnswerErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;

  return ANSWER_ERROR_MESSAGES[error.status] ?? fallback;
}

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
      api.post<void>(
        API_ROUTES.campaigns.acceptInvitation(campaignId),
        {},
        commandHeaders(),
      ),
    onSuccess: () => {
      invalidateInvitations(queryClient);
      toast.success("Tu as rejoint la campagne");
    },
    onError: (error) =>
      toast.error(toAnswerErrorMessage(error, ACCEPT_FALLBACK_ERROR)),
  });
}

export function useRefuseCampaignInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: string) =>
      api.post<void>(
        API_ROUTES.campaigns.refuseInvitation(campaignId),
        {},
        commandHeaders(),
      ),
    onSuccess: () => {
      invalidateInvitations(queryClient);
      toast.success("Demande refusée");
    },
    onError: (error) =>
      toast.error(toAnswerErrorMessage(error, REFUSE_FALLBACK_ERROR)),
  });
}
