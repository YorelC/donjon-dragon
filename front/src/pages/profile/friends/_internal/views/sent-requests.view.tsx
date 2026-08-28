import type { QueryState } from "@/shared/types/ui-state";
import type { SentRequest } from "../types/friends-schema";
import { FriendRow } from "./friend-row.view";
import { toSentRequestMeta } from "../utils/friend-meta";

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
      <div className="empty-state-text">
        Aucune invitation en attente de réponse.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {requests.data.map((request) => (
        <SentRequestRow key={request.id} request={request} />
      ))}
    </ul>
  );
}

function SentRequestRow({ request }: { request: SentRequest }) {
  return (
    <FriendRow
      name={request.recipient.displayName}
      meta={toSentRequestMeta(request.createdAt)}
      tone="distant"
    >
      <span className="pill">En attente</span>
    </FriendRow>
  );
}
