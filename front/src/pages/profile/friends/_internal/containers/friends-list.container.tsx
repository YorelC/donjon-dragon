import { useFriends } from "../queries/use-friends";
import { useFriendRemoval } from "../hooks/use-friend-removal";
import { FriendsListView } from "../views/friends-list.view";

export function FriendsListContainer() {
  const friendsQuery = useFriends(true);
  const removal = useFriendRemoval();

  return (
    <FriendsListView
      friends={friendsQuery.data ?? []}
      loading={friendsQuery.isLoading}
      error={friendsQuery.isError}
      removal={removal}
    />
  );
}
