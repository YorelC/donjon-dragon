import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  Character,
  ComputedCharacter,
  FinalizeCharacterDto,
  PreviewCharacterSheetDto,
} from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";

/**
 * Le tirage vit au back : le front demande, attend, et affiche ce qui revient.
 * C'est ce qui rend la répartition vérifiable — et c'est sur cette attente que
 * viendra se brancher l'animation de dés.
 */
export function useRollAbilities(campaignId: string, characterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.post<Character>(API_ROUTES.characters.abilityRoll(campaignId, characterId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
    onError: () => toast.error("Impossible de lancer les dés"),
  });
}

/** L'aperçu ne persiste rien : c'est la fiche qu'on obtiendrait avec ces choix. */
export function usePreviewSheet(campaignId: string) {
  return useMutation({
    mutationFn: (payload: PreviewCharacterSheetDto) =>
      api.post<ComputedCharacter>(API_ROUTES.characters.sheetPreview(campaignId), payload),
  });
}

export function useFinalizeCharacter(campaignId: string, characterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FinalizeCharacterDto) =>
      api.put<Character>(
        API_ROUTES.characters.finalize(campaignId, characterId),
        payload,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Personnage terminé");
    },
    onError: () => toast.error("Impossible de terminer ce personnage"),
  });
}
