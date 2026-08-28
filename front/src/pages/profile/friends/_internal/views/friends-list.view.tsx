import { Button } from "@/shared/components/atoms/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/atoms/alert-dialog";
import type { QueryState } from "@/shared/types/ui-state";
import type { AcceptedFriend } from "@/shared/types/friend";
import type { FriendRemoval } from "../hooks/use-friend-removal";
import { FriendRow } from "./friend-row.view";

interface FriendsListViewProps {
  friends: QueryState<AcceptedFriend[]>;
  removal: FriendRemoval;
}

export function FriendsListView({ friends, removal }: FriendsListViewProps) {
  if (friends.loading)
    return <div className="empty-state-text">Chargement...</div>;
  if (friends.error)
    return (
      <div className="empty-state-text">Erreur lors du chargement des amis.</div>
    );
  if (friends.data.length === 0)
    return (
      <div className="empty-state-text">
        Aucun compagnon dans votre liste pour l'instant.
      </div>
    );

  return (
    <ul className="flex flex-col gap-2.5">
      {friends.data.map((friend) => (
        <AcceptedFriendRow
          key={friend.friendshipId}
          friend={friend}
          removal={removal}
        />
      ))}
    </ul>
  );
}

interface FriendRowProps {
  friend: AcceptedFriend;
  removal: FriendRemoval;
}

function AcceptedFriendRow({ friend, removal }: FriendRowProps) {
  return (
    <FriendRow name={friend.friend.displayName} tone="settled">
      <RemoveFriendDialog friend={friend} removal={removal} />
    </FriendRow>
  );
}

function RemoveFriendDialog({ friend, removal }: FriendRowProps) {
  const { friendshipId } = friend;

  return (
    <AlertDialog
      open={removal.selectedFriendId === friendshipId}
      onOpenChange={(open) =>
        open ? removal.onClick(friendshipId) : removal.onCancel()
      }
    >
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={removal.isPending}>
          {removal.isPending ? "Suppression..." : "Retirer"}
        </Button>
      </AlertDialogTrigger>
      <RemoveFriendConfirmation
        displayName={friend.friend.displayName}
        removal={removal}
      />
    </AlertDialog>
  );
}

interface RemoveFriendConfirmationProps {
  displayName: string;
  removal: FriendRemoval;
}

function RemoveFriendConfirmation({
  displayName,
  removal,
}: RemoveFriendConfirmationProps) {
  return (
    <AlertDialogContent size="sm">
      <AlertDialogHeader>
        <AlertDialogTitle>Supprimer {displayName} ?</AlertDialogTitle>
        <AlertDialogDescription>
          Voulez-vous vraiment supprimer {displayName} ?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <RemoveFriendActions removal={removal} />
    </AlertDialogContent>
  );
}

function RemoveFriendActions({ removal }: { removal: FriendRemoval }) {
  return (
    <AlertDialogFooter>
      <AlertDialogCancel onClick={removal.onCancel}>Annuler</AlertDialogCancel>
      <AlertDialogAction
        variant="destructive"
        onClick={removal.onConfirm}
        disabled={removal.isPending}
      >
        Supprimer
      </AlertDialogAction>
    </AlertDialogFooter>
  );
}
