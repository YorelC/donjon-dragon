import { Button } from "@/shared/components/atoms/button";
import { Card, CardContent } from "@/shared/components/atoms/card";
import type { QueryState } from "@/shared/types/ui-state";
import type { RequestModeration } from "../hooks/use-request-moderation";
import type { ReceivedRequest } from "../types/friends-schema";

interface ReceivedRequestsViewProps {
  requests: QueryState<ReceivedRequest[]>;
  moderation: RequestModeration;
}

export function ReceivedRequestsView({
  requests,
  moderation,
}: ReceivedRequestsViewProps) {
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
        <ReceivedRequestRow
          key={request.id}
          request={request}
          moderation={moderation}
        />
      ))}
    </div>
  );
}

interface ReceivedRequestRowProps {
  request: ReceivedRequest;
  moderation: RequestModeration;
}

function ReceivedRequestRow({ request, moderation }: ReceivedRequestRowProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <span className="font-medium">{request.requester.displayName}</span>
        <ModerationActions requestId={request.id} moderation={moderation} />
      </CardContent>
    </Card>
  );
}

interface ModerationActionsProps {
  requestId: string;
  moderation: RequestModeration;
}

function ModerationActions({ requestId, moderation }: ModerationActionsProps) {
  return (
    <div className="flex gap-2">
      <AcceptRequestButton requestId={requestId} moderation={moderation} />
      <RefuseRequestButton requestId={requestId} moderation={moderation} />
    </div>
  );
}

function AcceptRequestButton({ requestId, moderation }: ModerationActionsProps) {
  return (
    <Button
      onClick={() => moderation.onAccept(requestId)}
      disabled={moderation.acceptPending}
      variant="default"
      size="sm"
    >
      {moderation.acceptPending ? "Acceptation..." : "Accepter"}
    </Button>
  );
}

function RefuseRequestButton({ requestId, moderation }: ModerationActionsProps) {
  return (
    <Button
      onClick={() => moderation.onRefuse(requestId)}
      disabled={moderation.refusePending}
      variant="destructive"
      size="sm"
    >
      {moderation.refusePending ? "Refus..." : "Refuser"}
    </Button>
  );
}
