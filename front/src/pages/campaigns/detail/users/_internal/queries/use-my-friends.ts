import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";

/**
 * Forme rendue par GET /api/friends. Redéclarée ici et non importée de la page
 * amis : le `_internal/` d'une page ne traverse jamais vers une autre (ESLint
 * l'arme). Le jour où un troisième appelant en a besoin, elle remonte dans
 * `@/shared` par un commit dédié.
 */
export interface CampaignFriend {
  friendshipId: string;
  friend: { displayName: string };
}

export const MY_FRIENDS_KEY = ["campaigns", "invitable-friends"] as const;

/**
 * Chargée seulement quand la modale d'invitation est ouverte : la liste ne sert
 * qu'à remplir son sélecteur.
 */
export function useMyFriends(enabled: boolean) {
  return useQuery({
    queryKey: MY_FRIENDS_KEY,
    queryFn: () => api.get<CampaignFriend[]>(API_ROUTES.friends.list),
    enabled,
    retry: false,
  });
}
