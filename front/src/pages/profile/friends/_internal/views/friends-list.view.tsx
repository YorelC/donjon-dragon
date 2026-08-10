import { Button } from "@/shared/components/atoms/button";
import { Card, CardContent } from "@/shared/components/atoms/card";
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
import type { AcceptedFriend } from "../types/friends-schema";
import type { FriendRemoval } from "../hooks/use-friend-removal";

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
    return <div className="empty-state-text">Tu n'as pas encore d'amis.</div>;

  return (
    <div className="space-y-2">
      {friends.data.map((friend) => (
        <FriendRow key={friend.friendshipId} friend={friend} removal={removal} />
      ))}
    </div>
  );
}

interface FriendRowProps {
  friend: AcceptedFriend;
  removal: FriendRemoval;
}

function FriendRow({ friend, removal }: FriendRowProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <span className="font-medium">{friend.friend.displayName}</span>
        <RemoveFriendDialog friend={friend} removal={removal} />
      </CardContent>
    </Card>
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
        <Button variant="destructive" size="sm" disabled={removal.isPending}>
          {removal.isPending ? "Suppression..." : "Supprimer"}
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
