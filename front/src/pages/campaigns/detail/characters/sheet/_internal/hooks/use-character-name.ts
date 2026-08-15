import { useCampaignCharacters } from "@/shared/queries/use-campaign-characters";

/** La fiche calculée ne porte pas le nom : il vit sur l'agrégat, pas sur le résolu. */
export function useCharacterName(campaignId: string, characterId: string): string {
  const { data: characters } = useCampaignCharacters(campaignId);

  return characters?.find((entry) => entry.id === characterId)?.name ?? "";
}
