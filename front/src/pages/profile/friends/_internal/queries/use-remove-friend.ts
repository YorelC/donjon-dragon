import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import type { AcceptedFriend } from "../types/friends-schema";

const TOAST_OPTIONS = {
  position: "top-right",
  duration: 3000,
} as const;

function optimisticUpdate(
  queryClient: ReturnType<typeof useQueryClient>,
  friendshipId: string,
) {
  queryClient.cancelQueries({ queryKey: ["friends", "list"] });
  const previousFriends = queryClient.getQueryData<AcceptedFriend[]>(["friends", "list"]);
  if (previousFriends) {
    const newFriends = previousFriends.filter(f => f.friendshipId !== friendshipId);
    queryClient.setQueryData<AcceptedFriend[]>(["friends", "list"], newFriends);
    return { previousFriends, newFriends } as const;
  }
  return null;
}

function rollbackOnError(
  queryClient: ReturnType<typeof useQueryClient>,
  context: { previousFriends?: AcceptedFriend[] } | null,
) {
  if (context?.previousFriends) {
    queryClient.setQueryData<AcceptedFriend[]>(["friends", "list"], context.previousFriends);
  }
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendshipId: string) =>
      api.delete<void>(API_ROUTES.friends.remove(friendshipId)),
    onMutate: (id) => optimisticUpdate(queryClient, id),
    onSuccess: () => toast.success("Ami supprimé", TOAST_OPTIONS),
    onError: (_err, _id, context) => {
      toast.error("Erreur lors de la suppression. Veuillez réessayer.", TOAST_OPTIONS);
      if (context?.previousFriends) {
        rollbackOnError(queryClient, context);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["friends", "list"] }),
  });
}
