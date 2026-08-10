import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import type { FriendRequest } from "@donjon-dragon/shared";
import type { SentRequest } from "../types/friends-schema";

/**
 * Écrit la réponse du POST directement dans le cache "sent" au lieu d'invalider
 * la query. Invalider forçait un aller-retour réseau : entre la résolution de la
 * mutation (isPending repasse à false) et la fin de ce refetch, pendingRecipients
 * ne contenait pas encore le destinataire — le bouton retombait un instant sur
 * "Envoyer" avant d'afficher "Invitation envoyée". Ici la réponse POST contient
 * déjà tout ce qu'un refetch aurait renvoyé.
 */
function handleSuccess(
  queryClient: ReturnType<typeof useQueryClient>,
  request: FriendRequest,
  displayName: string,
) {
  const sentRequest: SentRequest = { ...request, recipient: { displayName } };
  queryClient.setQueryData<SentRequest[]>(["friends", "sent"], (old) => [
    ...(old ?? []),
    sentRequest,
  ]);
  toast.success(`Invitation envoyée à ${displayName}`);
}

function handleError(err: unknown) {
  if (err instanceof ApiError && err.status === 409) {
    toast.info("Une invitation est déjà en attente pour ce joueur");
    return;
  }
  toast.error("Impossible d'envoyer l'invitation");
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayName: string) =>
      api.post<FriendRequest>(API_ROUTES.friends.sendRequest(displayName), {}),
    onSuccess: (data, displayName) => handleSuccess(queryClient, data, displayName),
    onError: handleError,
  });
}
