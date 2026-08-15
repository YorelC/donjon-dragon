import { useQuery } from "@tanstack/react-query";
import type { CharacterBuildDetailDto } from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";

export const characterBuildKey = (campaignId: string, characterId: string) =>
  ["campaigns", "characters", campaignId, characterId, "build"] as const;

/** Le build déjà éclaté du personnage édité, pour pré-remplir le wizard. */
export function useCharacterBuild(campaignId: string, characterId: string | null) {
  return useQuery({
    queryKey: characterBuildKey(campaignId, characterId ?? "new"),
    queryFn: () =>
      api.get<CharacterBuildDetailDto>(API_ROUTES.characters.build(campaignId, characterId!)),
    enabled: characterId !== null,
    retry: false,
  });
}
