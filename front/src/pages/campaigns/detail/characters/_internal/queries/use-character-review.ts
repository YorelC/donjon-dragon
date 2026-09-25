import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CharacterReviewCommandResult } from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { commandHeaders } from "@/shared/api/idempotency";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { campaignCharactersKey } from "@/shared/queries/use-campaign-characters";

export interface ReviewVariables {
  characterId: string;
  expectedRevision: number;
}

export interface RefuseVariables extends ReviewVariables {
  reason: string;
}

type ReviewRoute = (campaignId: string, characterId: string) => string;

function refresh(queryClient: QueryClient, campaignId: string): void {
  queryClient.invalidateQueries({ queryKey: campaignCharactersKey(campaignId) });
}

function useReviewCommand(campaignId: string, route: ReviewRoute, successMessage: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: ReviewVariables) => api.post<CharacterReviewCommandResult>(
      route(campaignId, variables.characterId),
      { expectedRevision: variables.expectedRevision }, commandHeaders(),
    ),
    onSuccess: () => { refresh(queryClient, campaignId); toast.success(successMessage); },
    onError: () => toast.error("Impossible de modifier la validation"),
  });
}

export function useSubmitCharacterReview(campaignId: string) {
  return useReviewCommand(campaignId, API_ROUTES.characters.reviewSubmit, "Fiche soumise au MJ");
}

export function useAcceptCharacterReview(campaignId: string) {
  return useReviewCommand(campaignId, API_ROUTES.characters.reviewAccept, "Fiche acceptée");
}

export function useRefuseCharacterReview(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: RefuseVariables) => api.post<CharacterReviewCommandResult>(
      API_ROUTES.characters.reviewRefuse(campaignId, variables.characterId),
      { expectedRevision: variables.expectedRevision, reason: variables.reason }, commandHeaders(),
    ),
    onSuccess: () => { refresh(queryClient, campaignId); toast.success("Fiche renvoyée en correction"); },
    onError: () => toast.error("Impossible de refuser cette fiche"),
  });
}
