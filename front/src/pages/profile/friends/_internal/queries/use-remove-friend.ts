import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import type { AcceptedFriend } from "../types/friends-schema";

async function handleMutate(
  queryClient: ReturnType<typeof useQueryClient>,
  friendshipId: string,
) {
  await queryClient.cancelQueries({ queryKey: ["friends", "list"] });
  const previous = queryClient.getQueryData<AcceptedFriend[]>(["friends", "list"]);
  queryClient.setQueryData<AcceptedFriend[]>(["friends", "list"], (old) =>
    old?.filter((f) => f.friendshipId !== friendshipId) ?? [],
  );
  return { previous };
}

function handleSuccess(queryClient: ReturnType<typeof useQueryClient>) {
  toast.success("Ami supprimé");
  queryClient.invalidateQueries({ queryKey: ["friends", "received", "count"] });
}

function handleError(
  queryClient: ReturnType<typeof useQueryClient>,
  _err: Error,
  _friendshipId: string,
  context: { previous: AcceptedFriend[] | undefined } | undefined,
) {
  if (context?.previous) {
    queryClient.setQueryData(["friends", "list"], context.previous);
  }
  toast.error("Erreur lors de la suppression. Veuillez réessayer.");
}

function handleSettled(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["friends", "list"] });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) =>
      api.delete(API_ROUTES.friends.remove(friendshipId)),
    onMutate: (friendshipId) => handleMutate(queryClient, friendshipId),
    onSuccess: () => handleSuccess(queryClient),
    onError: (err, id, ctx) => handleError(queryClient, err, id, ctx),
    onSettled: () => handleSettled(queryClient),
  });
}