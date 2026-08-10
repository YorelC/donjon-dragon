import { Badge } from "@/shared/components/atoms/badge";
import { Card, CardContent } from "@/shared/components/atoms/card";
import type { QueryState } from "@/shared/types/ui-state";
import type { SentRequest } from "../types/friends-schema";

interface SentRequestsViewProps {
  requests: QueryState<SentRequest[]>;
}

export function SentRequestsView({ requests }: SentRequestsViewProps) {
  if (requests.loading)
    return <div className="empty-state-text">Chargement...</div>;
  if (requests.error)
    return (
      <div className="empty-state-text">
        Erreur lors du chargement des demandes.
      </div>
    );
  if (requests.data.length === 0) {
    return (
      <div className="empty-state-text">Tu n'as pas de demandes en attente.</div>
    );
  }

  return (
    <div className="space-y-2">
      {requests.data.map((request) => (
        <SentRequestRow key={request.id} request={request} />
      ))}
    </div>
  );
}

function SentRequestRow({ request }: { request: SentRequest }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <span className="font-medium">{request.recipient.displayName}</span>
        <Badge variant="outline">En attente</Badge>
      </CardContent>
    </Card>
  );
}
