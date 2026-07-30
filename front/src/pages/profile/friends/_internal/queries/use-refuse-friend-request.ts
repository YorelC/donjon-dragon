import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";

export function useRefuseFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendshipId: string) =>
      api.post<void>(API_ROUTES.friends.refuse(friendshipId), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends", "received"] });
    },
  });
}
