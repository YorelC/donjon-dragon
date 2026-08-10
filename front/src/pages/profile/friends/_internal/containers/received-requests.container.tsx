import { useReceivedRequests } from "../queries/use-received-requests";
import { useRequestModeration } from "../hooks/use-request-moderation";
import { ReceivedRequestsView } from "../views/received-requests.view";

export function ReceivedRequestsContainer() {
  const receivedQuery = useReceivedRequests(true);
  const moderation = useRequestModeration();

  return (
    <ReceivedRequestsView
      requests={{
        data: receivedQuery.data ?? [],
        loading: receivedQuery.isLoading,
        error: receivedQuery.isError,
      }}
      moderation={moderation}
    />
  );
}
