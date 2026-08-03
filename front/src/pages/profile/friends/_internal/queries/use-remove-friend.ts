import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";

export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendshipId: string) =>
      api.delete<void>(API_ROUTES.friends.remove(friendshipId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends", "list"] });
    },
  });
}
