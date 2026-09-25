import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  CharacterPersonalDetailsCommandResult,
  UpdateCharacterPersonalDetailsDto,
} from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { commandHeaders } from "@/shared/api/idempotency";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { campaignCharactersKey } from "@/shared/queries/use-campaign-characters";

interface PersonalDetailsVariables extends UpdateCharacterPersonalDetailsDto {
  characterId: string;
}

export function useUpdateCharacterPersonalDetails(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ characterId, ...body }: PersonalDetailsVariables) =>
      api.put<CharacterPersonalDetailsCommandResult>(
        API_ROUTES.characters.personalDetails(campaignId, characterId), body, commandHeaders(),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignCharactersKey(campaignId) });
      toast.success("Données personnelles mises à jour");
    },
    onError: () => toast.error("Impossible de modifier les données personnelles"),
  });
}
