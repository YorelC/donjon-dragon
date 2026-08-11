import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateCharacterDto } from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { campaignCharactersKey } from "./use-campaign-characters";

function refreshCharacters(queryClient: QueryClient, campaignId: string) {
  queryClient.invalidateQueries({ queryKey: campaignCharactersKey(campaignId) });
}

export function useCreateCharacter(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sheet: CreateCharacterDto) =>
      api.post(API_ROUTES.characters.create(campaignId), sheet),
    onSuccess: () => {
      refreshCharacters(queryClient, campaignId);
      toast.success("Personnage créé");
    },
    onError: () => toast.error("Impossible de créer ce personnage"),
  });
}

export interface UpdateCharacterVariables {
  characterId: string;
  sheet: CreateCharacterDto;
}

export function useUpdateCharacter(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ characterId, sheet }: UpdateCharacterVariables) =>
      api.put(API_ROUTES.characters.update(campaignId, characterId), sheet),
    onSuccess: () => {
      refreshCharacters(queryClient, campaignId);
      toast.success("Personnage mis à jour");
    },
    onError: () => toast.error("Impossible de modifier ce personnage"),
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
