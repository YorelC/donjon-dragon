import { useSentRequests } from "../queries/use-sent-requests";
import { SentRequestsView } from "../views/sent-requests.view";

export function SentRequestsContainer() {
  const sentQuery = useSentRequests(true);

  return (
    <SentRequestsView
      requests={{
        data: sentQuery.data ?? [],
        loading: sentQuery.isLoading,
        error: sentQuery.isError,
      }}
    />
  );
}
