import { useState } from "react";
import { useFriends } from "../queries/use-friends";
import { useRemoveFriend } from "../queries/use-remove-friend";
import { FriendsListView } from "../views/friends-list.view";
import type { AcceptedFriend } from "../types/friends-schema";

function getFriendDisplayName(friends: AcceptedFriend[], id: string): string {
  const found = friends.find((f) => f.friendshipId === id);
  return found?.friend.displayName ?? "cet ami";
}

export function FriendsListContainer() {
  const friendsQuery = useFriends(true);
  const { mutate: removeFriend, isPending: isDeletePending } = useRemoveFriend();
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const friends = friendsQuery.data ?? [];
  return (
    <FriendsListView friends={friends}
      loading={friendsQuery.isLoading}
      error={friendsQuery.isError}
      selectedFriendId={selectedFriendId}
      friendDisplayName={(id) => getFriendDisplayName(friends, id)}
      isDeletePending={isDeletePending}
      onDeleteClick={setSelectedFriendId}
      onDeleteConfirm={() => {
        if (selectedFriendId) removeFriend(selectedFriendId); setSelectedFriendId(null);
      }}
      onDeleteCancel={() => setSelectedFriendId(null)}
    />
  );
}