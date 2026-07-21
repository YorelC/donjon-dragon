import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import type { Character, CreateCharacterDto } from "../character-schema";

export function useCharacters(userId: string) {
  return useQuery({
    queryKey: ["characters", userId],
    queryFn: () => api.get<Character[]>(`/api/characters?userId=${userId}`),
    enabled: !!userId,
  });
}

export function useCharacter(id: string) {
  return useQuery({
    queryKey: ["character", id],
    queryFn: () => api.get<Character>(`/api/characters/${id}`),
    enabled: !!id,
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCharacterDto & { userId: string }) =>
      api.post<Character>("/api/characters", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/characters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}
