import { Button } from "@/shared/components/atoms/button";
import { Card, CardContent } from "@/shared/components/atoms/card";
import type { ReceivedRequest } from "../types/friends-schema";

interface ReceivedRequestsViewProps {
  requests: ReceivedRequest[];
  loading: boolean;
  error: boolean;
  onAccept: (friendshipId: string) => void;
  onRefuse: (friendshipId: string) => void;
  acceptMutationPending: boolean;
  refuseMutationPending: boolean;
}

export function ReceivedRequestsView({
  requests,
  loading,
  error,
  onAccept,
  onRefuse,
  acceptMutationPending,
  refuseMutationPending,
}: ReceivedRequestsViewProps) {
  if (loading) return <div className="empty-state-text">Chargement...</div>;
  if (error) return <div className="empty-state-text">Erreur lors du chargement des demandes.</div>;
  if (requests.length === 0) {
    return (
      <div className="empty-state-text">Tu n'as pas de demandes en attente.</div>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((req) => (
        <Card key={req.id}>
          <CardContent className="flex items-center justify-between p-4">
            <span className="font-medium">{req.requester.displayName}</span>
            <div className="flex gap-2">
              <Button
                onClick={() => onAccept(req.id)}
                disabled={acceptMutationPending}
                variant="default"
                size="sm"
              >
                {acceptMutationPending ? "Acceptation..." : "Accepter"}
              </Button>
              <Button
                onClick={() => onRefuse(req.id)}
                disabled={refuseMutationPending}
                variant="destructive"
                size="sm"
              >
                {refuseMutationPending ? "Refus..." : "Refuser"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
