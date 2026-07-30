import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import type { Character, CreateCharacterDto } from "../types/character-schema";

export function useCharacters(userId: string) {
  return useQuery({
    queryKey: ["characters", userId],
    queryFn: () => api.get<Character[]>(API_ROUTES.characters.byUser(userId)),
    enabled: !!userId,
  });
}

export function useCharacter(id: string) {
  return useQuery({
    queryKey: ["character", id],
    queryFn: () => api.get<Character>(API_ROUTES.characters.byId(id)),
    enabled: !!id,
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCharacterDto & { userId: string }) =>
      api.post<Character>(API_ROUTES.characters.create, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(API_ROUTES.characters.byId(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}
