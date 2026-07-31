import { useFriends } from "../queries/use-friends";
import { useRemoveFriend } from "../queries/use-remove-friend";
import { FriendsListView } from "../views/friends-list.view";

export function FriendsListContainer() {
  const friendsQuery = useFriends(true);
  const removeMutation = useRemoveFriend();

  return (
    <FriendsListView
      friends={friendsQuery.data ?? []}
      loading={friendsQuery.isLoading}
      error={friendsQuery.isError}
      onRemove={(friendshipId) => removeMutation.mutate(friendshipId)}
      removeMutationPending={removeMutation.isPending}
    />
  );
}
