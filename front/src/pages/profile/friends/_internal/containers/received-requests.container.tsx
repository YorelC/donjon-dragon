import { useReceivedRequests } from "../queries/use-received-requests";
import { useAcceptFriendRequest } from "../queries/use-accept-friend-request";
import { useRefuseFriendRequest } from "../queries/use-refuse-friend-request";
import { ReceivedRequestsView } from "../views/received-requests.view";

export function ReceivedRequestsContainer() {
  const receivedQuery = useReceivedRequests();
  const acceptMutation = useAcceptFriendRequest();
  const refuseMutation = useRefuseFriendRequest();

  return (
    <ReceivedRequestsView
      requests={receivedQuery.data ?? []}
      loading={receivedQuery.isLoading}
      error={receivedQuery.isError}
      onAccept={(friendshipId) => acceptMutation.mutate(friendshipId)}
      onRefuse={(friendshipId) => refuseMutation.mutate(friendshipId)}
      acceptMutationPending={acceptMutation.isPending}
      refuseMutationPending={refuseMutation.isPending}
    />
  );
}
