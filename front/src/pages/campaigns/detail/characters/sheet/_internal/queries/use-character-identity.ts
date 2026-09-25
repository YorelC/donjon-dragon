import { useQuery } from "@tanstack/react-query";
import type { CharacterBuildDetailDto } from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";

export const characterIdentityKey = (campaignId: string, characterId: string) =>
  ["campaigns", "characters", campaignId, characterId, "build"] as const;

/**
 * L'identité persistée — nom, alignement, mensurations, description. La fiche
 * calculée ne la porte pas : elle se lit sur le build, même audience privée.
 */
export function useCharacterIdentity(campaignId: string, characterId: string) {
  return useQuery({
    queryKey: characterIdentityKey(campaignId, characterId),
    queryFn: () =>
      api.get<CharacterBuildDetailDto>(API_ROUTES.characters.build(campaignId, characterId)),
    retry: false,
  });
}
