import { useState } from "react";
import { useRemoveFriend } from "../queries/use-remove-friend";

/** Les cinq props de la suppression voyagent ensemble jusqu'à la modale. */
export interface FriendRemoval {
  selectedFriendId: string | null;
  isPending: boolean;
  onClick: (friendshipId: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function useFriendRemoval(): FriendRemoval {
  const { mutate: removeFriend, isPending } = useRemoveFriend();
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  function confirmRemoval() {
    if (selectedFriendId) removeFriend(selectedFriendId);
    setSelectedFriendId(null);
  }

  return {
    selectedFriendId,
    isPending,
    onClick: setSelectedFriendId,
    onConfirm: confirmRemoval,
    onCancel: () => setSelectedFriendId(null),
  };
}
