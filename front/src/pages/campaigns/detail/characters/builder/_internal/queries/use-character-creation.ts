import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  Character,
  ComputedCharacter,
  CreateCharacterDto,
  FinalizeCharacterDto,
  IssuedAbilityRoll,
  PreviewCharacterSheetDto,
} from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { commandHeaders } from "@/shared/api/idempotency";
import { API_ROUTES } from "@/shared/constants/api-routes";

/** L'aperçu ne persiste rien : c'est la fiche qu'on obtiendrait avec ces choix. */
export function usePreviewSheet(campaignId: string) {
  return useMutation({
    mutationFn: (payload: PreviewCharacterSheetDto) =>
      api.post<ComputedCharacter>(API_ROUTES.characters.sheetPreview(campaignId), payload),
  });
}

/**
 * Le serveur lance les dés, et lui seul : le navigateur ne fait plus que
 * demander un tirage, puis en désigner l'identité au moment de créer.
 */
export function useRollAbilities(campaignId: string) {
  return useMutation({
    mutationFn: () =>
      api.post<IssuedAbilityRoll>(
        API_ROUTES.characters.abilityRoll(campaignId),
        undefined,
        commandHeaders(),
      ),
    onError: () => toast.error("Impossible de lancer les dés"),
  });
}

/** Le wizard rend sa copie complète : le personnage naît déjà fini. */
export function useCreateCharacter(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCharacterDto) =>
      api.post<Character>(
        API_ROUTES.characters.create(campaignId),
        payload,
        commandHeaders(),
      ),
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
