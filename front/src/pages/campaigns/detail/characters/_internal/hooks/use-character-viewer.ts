import type { CampaignDetail } from "@donjon-dragon/shared";
import { useAuthStore } from "@/shared/stores/auth.store";
import type { CharacterRowViewer } from "../views/character-row.view";

/**
 * Qui regarde la liste : son nom d'affichage, et s'il la voit en maître du jeu.
 * Le rôle se relit dans le détail de campagne, jamais dans le store d'auth : il
 * dépend de la campagne ouverte, pas de la session.
 */
export function useCharacterViewer(
  campaign: CampaignDetail | undefined,
): CharacterRowViewer {
  const displayName = useAuthStore((state) => state.user?.displayName ?? "");

  return { isGameMaster: campaign?.myRole === "gameMaster", displayName };
}
