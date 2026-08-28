import { Button } from "@/shared/components/atoms/button";
import type { QueryState } from "@/shared/types/ui-state";
import type { RequestModeration } from "../hooks/use-request-moderation";
import type { ReceivedRequest } from "../types/friends-schema";
import { FriendRow } from "./friend-row.view";
import { toReceivedRequestMeta } from "../utils/friend-meta";

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
      <div className="empty-state-text">
        Vous n'avez aucune demande en attente.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
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
    <FriendRow
      name={request.requester.displayName}
      meta={toReceivedRequestMeta(request.createdAt)}
      tone="pending"
    >
      <AcceptRequestButton requestId={request.id} moderation={moderation} />
      <RefuseRequestButton requestId={request.id} moderation={moderation} />
    </FriendRow>
  );
}

interface ModerationActionsProps {
  requestId: string;
  moderation: RequestModeration;
}

function AcceptRequestButton({ requestId, moderation }: ModerationActionsProps) {
  return (
    <Button
      onClick={() => moderation.onAccept(requestId)}
      disabled={moderation.acceptPending}
      variant="default"
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
      variant="outline"
    >
      {moderation.refusePending ? "Refus..." : "Refuser"}
    </Button>
  );
}
