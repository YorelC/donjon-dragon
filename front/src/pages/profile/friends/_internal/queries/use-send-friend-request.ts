import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import type { FriendRequest } from "@donjon-dragon/shared";

export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayName: string) =>
      api.post<FriendRequest>(API_ROUTES.friends.sendRequest(displayName), {}),
    onSuccess: (_data, displayName) => {
      // "sent" porte l'état "déjà invité" (pendingRecipients) — "search" ne
      // contient que des pseudos et ne dépend jamais d'une invitation : l'invalider
      // ne faisait que refetch toute la liste de résultats à chaque envoi.
      queryClient.invalidateQueries({ queryKey: ["friends", "sent"] });
      toast.success(`Invitation envoyée à ${displayName}`);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        toast.info("Une invitation est déjà en attente pour ce joueur");
        return;
      }
      toast.error("Impossible d'envoyer l'invitation");
    },
  });
}
