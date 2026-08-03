import { useState } from "react";
import { Button } from "@/shared/components/atoms/button";
import { Card, CardContent } from "@/shared/components/atoms/card";
import type { AcceptedFriend } from "../types/friends-schema";
import { RemoveFriendModalView } from "./remove-friend-modal.view";

interface FriendsListViewProps {
  friends: AcceptedFriend[];
  loading: boolean;
  error: boolean;
  onRemove: (friendshipId: string) => void;
  removeMutationPending: boolean;
}

export function FriendsListView({
  friends,
  loading,
  error,
  onRemove,
  removeMutationPending,
}: FriendsListViewProps) {
  const [openModal, setOpenModal] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<string | null>(null);

  const handlers = createHandlers(
    friends,
    onRemove,
    setOpenModal,
    setFriendToRemove,
    friendToRemove,
  );

  if (loading) return <div className="empty-state-text">Chargement...</div>;
  if (error) return <div className="empty-state-text">Erreur lors du chargement des amis.</div>;
  if (friends.length === 0) {
    return <div className="empty-state-text">Tu n'as pas encore d'amis.</div>;
  }

  return (
    <>
      <div className="space-y-2">
        {friends.map(({ friendshipId, friend }) => (
          <Card key={friendshipId}>
            <CardContent className="flex items-center justify-between p-4">
              <span className="font-medium">{friend.displayName}</span>
              <Button
                onClick={() => handlers.onRemoveClick(friendshipId, friend.displayName)}
                disabled={removeMutationPending}
                variant="destructive"
                size="sm"
              >
                {removeMutationPending ? "Suppression..." : "Supprimer"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <RemoveFriendModalView
        open={openModal}
        onOpenChange={handlers.onCloseModal}
        friendDisplayName={friendToRemove ?? ""}
        onConfirm={handlers.onConfirmRemove}
        isDeleting={removeMutationPending}
      />
    </>
  );
}

interface Handlers {
  onRemoveClick: (friendshipId: string, friendName: string) => void;
  onConfirmRemove: () => void;
  onCloseModal: () => void;
}

function createHandlers(
  friends: AcceptedFriend[],
  onRemove: (friendshipId: string) => void,
  setOpenModal: (open: boolean) => void,
  setFriendToRemove: (name: string | null) => void,
  currentFriendToRemove: string | null,
): Handlers {
  return {
    onRemoveClick(friendshipId: string, friendName: string) {
      setFriendToRemove(friendName);
      setOpenModal(true);
    },
    onConfirmRemove() {
      if (currentFriendToRemove) {
        const friendId = friends.find((f) => f.friend.displayName === currentFriendToRemove)?.friendshipId;
        if (friendId) {
          onRemove(friendId);
        }
      }
      setOpenModal(false);
      setFriendToRemove(null);
    },
    onCloseModal() {
      setOpenModal(false);
      setFriendToRemove(null);
    },
  };
}
