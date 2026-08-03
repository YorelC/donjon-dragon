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
import type { AcceptedFriend } from "../types/friends-schema";

interface FriendsListViewProps {
  friends: AcceptedFriend[];
  loading: boolean;
  error: boolean;
  selectedFriendId: string | null;
  friendDisplayName: (id: string) => string;
  isDeletePending: boolean;
  onDeleteClick: (id: string) => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

export function FriendsListView({
  friends,
  loading,
  error,
  selectedFriendId,
  friendDisplayName,
  isDeletePending,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
}: FriendsListViewProps) {
  if (loading) return <div className="empty-state-text">Chargement...</div>;
  if (error) return <div className="empty-state-text">Erreur lors du chargement des amis.</div>;
  if (friends.length === 0) return <div className="empty-state-text">Tu n'as pas encore d'amis.</div>;

  return (
    <div className="space-y-2">
      {friends.map(({ friendshipId, friend }) => (
        <Card key={friendshipId}>
          <CardContent className="flex items-center justify-between p-4">
            <span className="font-medium">{friend.displayName}</span>
            <AlertDialog
              open={selectedFriendId === friendshipId}
              onOpenChange={(open) =>
                open ? onDeleteClick(friendshipId) : onDeleteCancel()
              }
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeletePending}>
                  {isDeletePending ? "Suppression..." : "Supprimer"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent size="sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Supprimer {friendDisplayName(friendshipId)} ?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Voulez-vous vraiment supprimer {friendDisplayName(friendshipId)} ?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={onDeleteCancel}>
                    Annuler
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={onDeleteConfirm}
                    disabled={isDeletePending}
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}