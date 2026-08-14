import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { StartCharacterDto } from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { campaignCharactersKey } from "@/shared/queries/use-campaign-characters";

function refreshCharacters(queryClient: QueryClient, campaignId: string) {
  queryClient.invalidateQueries({ queryKey: campaignCharactersKey(campaignId) });
}

/**
 * Créer un personnage ouvre un brouillon : un nom, et rien d'autre. Le tirage
 * des dés et les choix viennent ensuite, par le wizard.
 */
export function useStartCharacter(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draft: StartCharacterDto) =>
      api.post(API_ROUTES.characters.start(campaignId), draft),
    onSuccess: () => {
      refreshCharacters(queryClient, campaignId);
      toast.success("Personnage créé");
    },
    onError: () => toast.error("Impossible de créer ce personnage"),
  });
}

export interface RenameCharacterVariables {
  characterId: string;
  name: string;
}

export function useRenameCharacter(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ characterId, name }: RenameCharacterVariables) =>
      api.patch(API_ROUTES.characters.rename(campaignId, characterId), { name }),
    onSuccess: () => {
      refreshCharacters(queryClient, campaignId);
      toast.success("Personnage renommé");
    },
    onError: () => toast.error("Impossible de renommer ce personnage"),
  });
}

export function useDeleteCharacter(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (characterId: string) =>
      api.delete(API_ROUTES.characters.remove(campaignId, characterId)),
    onSuccess: () => {
      refreshCharacters(queryClient, campaignId);
      toast.success("Personnage supprimé");
    },
    onError: () => toast.error("Impossible de supprimer ce personnage"),
  });
}

export interface AssignCharacterVariables {
  characterId: string;
  playerDisplayName: string;
}

export function useAssignCharacter(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ characterId, playerDisplayName }: AssignCharacterVariables) =>
      api.post(API_ROUTES.characters.assign(campaignId, characterId), {
        playerDisplayName,
      }),
    onSuccess: () => {
      refreshCharacters(queryClient, campaignId);
      toast.success("Personnage attribué");
    },
    onError: () => toast.error("Impossible d'attribuer ce personnage"),
  });
}

export function useUnassignCharacter(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (characterId: string) =>
      api.post(API_ROUTES.characters.unassign(campaignId, characterId)),
    onSuccess: () => {
      refreshCharacters(queryClient, campaignId);
      toast.success("Personnage libéré");
    },
    onError: () => toast.error("Impossible de libérer ce personnage"),
  });
}
