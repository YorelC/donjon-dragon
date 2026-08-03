import { Button } from "@/shared/components/atoms/button";
import { Card, CardContent } from "@/shared/components/atoms/card";
import type { AcceptedFriend } from "../types/friends-schema";

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
  if (loading) return <div className="empty-state-text">Chargement...</div>;
  if (error) return <div className="empty-state-text">Erreur lors du chargement des amis.</div>;
  if (friends.length === 0) {
    return <div className="empty-state-text">Tu n'as pas encore d'amis.</div>;
  }

  return (
    <div className="space-y-2">
      {friends.map(({ friendshipId, friend }) => (
        <Card key={friendshipId}>
          <CardContent className="flex items-center justify-between p-4">
            <span className="font-medium">{friend.displayName}</span>
            <Button
              onClick={() => onRemove(friendshipId)}
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
  );
}
