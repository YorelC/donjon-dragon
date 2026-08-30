import { useQuery } from "@tanstack/react-query";
import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";

/**
 * Remonté de `pages/campaigns/detail/characters/_internal/` : la liste sert
 * maintenant à trois écrans — la table, le builder, et la liste des membres, qui
 * y lit le personnage de chacun.
 *
 * Le serveur projette chaque fiche selon qui la regarde : `pool` pour un joueur
 * qui n'y a pas droit, `controlled` pour la sienne, `gameMaster` pour tout le
 * reste. D'où l'union plutôt que `Character` — les champs sensibles n'arrivent
 * pas toujours.
 */
export const campaignCharactersKey = (campaignId: string) =>
  ["campaigns", "characters", campaignId] as const;

export function useCampaignCharacters(campaignId: string) {
  return useQuery({
    queryKey: campaignCharactersKey(campaignId),
    queryFn: () => api.get<CampaignCharacterListItem[]>(API_ROUTES.characters.list(campaignId)),
    retry: false,
  });
}
