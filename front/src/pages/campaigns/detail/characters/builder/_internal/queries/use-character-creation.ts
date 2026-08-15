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

/** L'aperçu ne persiste rien : c'est la fiche qu'on obtiendrait avec ces choix. */
export function usePreviewSheet(campaignId: string) {
  return useMutation({
    mutationFn: (payload: PreviewCharacterSheetDto) =>
      api.post<ComputedCharacter>(API_ROUTES.characters.sheetPreview(campaignId), payload),
  });
}

/** Le wizard rend sa copie complète : le personnage naît déjà fini. */
export function useCreateCharacter(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FinalizeCharacterDto) =>
      api.post<Character>(API_ROUTES.characters.create(campaignId), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Personnage créé");
    },
    onError: () => toast.error("Impossible de créer ce personnage"),
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
