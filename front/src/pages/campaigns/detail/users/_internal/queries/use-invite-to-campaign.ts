import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/shared/api/api";
import { commandHeaders } from "@/shared/api/idempotency";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { campaignDetailKey } from "@/shared/queries/use-campaign-detail";

/**
 * Le serveur refuse une invitation pour trois raisons distinctes, et l'utilisateur
 * n'a pas le même geste à faire selon laquelle : on lit donc le statut plutôt que
 * d'afficher un message unique qui le laisserait chercher.
 */
const INVITE_ERROR_MESSAGES: Record<number, string> = {
  403: "Tu ne peux inviter que tes amis.",
  404: "Aucun joueur ne porte ce pseudo.",
  409: "Ce joueur est déjà membre de la campagne ou a déjà une invitation en attente.",
};

const GENERIC_INVITE_ERROR = "Impossible d'envoyer l'invitation.";

/** Exportée pour être testée directement : c'est une fonction pure. */
export function toInviteErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return GENERIC_INVITE_ERROR;

  return INVITE_ERROR_MESSAGES[error.status] ?? GENERIC_INVITE_ERROR;
}

export interface InviteToCampaignVariables {
  campaignId: string;
  displayName: string;
}

export function useInviteToCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, displayName }: InviteToCampaignVariables) =>
      api.post<void>(
        API_ROUTES.campaigns.invite(campaignId),
        { displayName },
        commandHeaders(),
      ),
    // Le serveur répond 204 : sans cette invalidation, l'invité n'apparaît pas
    // dans « Invitations en attente » tant qu'on ne recharge pas la page.
    onSuccess: (_data, { campaignId, displayName }) => {
      queryClient.invalidateQueries({ queryKey: campaignDetailKey(campaignId) });
      toast.success(`Invitation envoyée à ${displayName}`);
    },
    onError: (error) => toast.error(toInviteErrorMessage(error)),
  });
}
