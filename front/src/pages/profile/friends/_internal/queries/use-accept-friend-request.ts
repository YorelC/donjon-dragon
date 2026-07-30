import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import type { Friendship } from "@donjon-dragon/shared";

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendshipId: string) =>
      api.post<Friendship>(API_ROUTES.friends.accept(friendshipId), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends", "received"] });
      queryClient.invalidateQueries({ queryKey: ["friends", "list"] });
    },
  });
}
