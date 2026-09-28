import { useParams } from "react-router-dom";
import { useCampaignCharacters } from "@/shared/queries/use-campaign-characters";
import { useCampaignDetail } from "@/shared/queries/use-campaign-detail";
import type { NamedRef } from "@/shared/utils/breadcrumb-trails";

/** Le nom pas encore arrivé : l'étape garde sa place au lieu de faire sauter le fil. */
export const PENDING_NAME = "…";

/** La campagne de la route ouverte, nommée dès que son détail est en cache. */
export function useCampaignRef(): NamedRef {
  const { campaignId = "" } = useParams();
  const { data } = useCampaignDetail(campaignId);

  return { id: campaignId, name: data?.name ?? PENDING_NAME };
}

/** Le personnage de la route ouverte, lu dans la liste de sa campagne. */
export function useCharacterRef(campaignId: string): NamedRef {
  const { characterId = "" } = useParams();
  const { data } = useCampaignCharacters(campaignId);
  const character = data?.find((entry) => entry.id === characterId);

  return { id: characterId, name: character?.name ?? PENDING_NAME };
}
