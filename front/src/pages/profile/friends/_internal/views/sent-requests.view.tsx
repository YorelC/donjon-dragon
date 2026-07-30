import { Badge } from "@/shared/components/atoms/badge";
import { Card, CardContent } from "@/shared/components/atoms/card";
import type { SentRequest } from "../types/friends-schema";

interface SentRequestsViewProps {
  requests: SentRequest[];
  loading: boolean;
  error: boolean;
}

export function SentRequestsView({
  requests,
  loading,
  error,
}: SentRequestsViewProps) {
  if (loading) return <div className="empty-state-text">Chargement...</div>;
  if (error) return <div className="empty-state-text">Erreur lors du chargement des demandes.</div>;
  if (requests.length === 0) {
    return <div className="empty-state-text">Tu n'as pas de demandes en attente.</div>;
  }

  return (
    <div className="space-y-2">
      {requests.map((req) => (
        <Card key={req.id}>
          <CardContent className="flex items-center justify-between p-4">
            <span className="font-medium">{req.recipient.displayName}</span>
            <Badge variant="outline">En attente</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
