import { useFriendsTabs } from "../hooks/use-friends-tabs";
import { useSearchForm } from "../hooks/use-search-form";
import { useFriends } from "../queries/use-friends";
import { useReceivedRequests } from "../queries/use-received-requests";
import { useSentRequests } from "../queries/use-sent-requests";
import { useSearchUsers } from "../queries/use-search-users";
import { useSendFriendRequest } from "../queries/use-send-friend-request";
import { useAcceptFriendRequest } from "../queries/use-accept-friend-request";
import { useRefuseFriendRequest } from "../queries/use-refuse-friend-request";
import { useRemoveFriend } from "../queries/use-remove-friend";
import { FriendsView } from "../views/friends.view";

export function FriendsContainer() {
  const { activeTab, setActiveTab } = useFriendsTabs();
  const {
    control: searchControl,
    errors: searchErrors,
    onSubmit: onSearchSubmit,
    submittedQuery,
  } = useSearchForm();

  const friendsQuery = useFriends(activeTab === "friends");
  const receivedQuery = useReceivedRequests(activeTab === "received");
  const sentQuery = useSentRequests(activeTab === "sent" || activeTab === "search");
  const searchQuery = useSearchUsers(submittedQuery);

  const pendingRecipientIds = new Set(
    (sentQuery.data ?? []).map((request) => request.recipient.id)
  );

  const sendMutation = useSendFriendRequest();
  const acceptMutation = useAcceptFriendRequest();
  const refuseMutation = useRefuseFriendRequest();
  const removeMutation = useRemoveFriend();

  const handleSendRequest = (displayName: string) => {
    sendMutation.mutate(displayName);
  };

  const handleAccept = (friendshipId: string) => {
    acceptMutation.mutate(friendshipId);
  };

  const handleRefuse = (friendshipId: string) => {
    refuseMutation.mutate(friendshipId);
  };

  const handleRemove = (friendshipId: string) => {
    removeMutation.mutate(friendshipId);
  };

  return (
    <FriendsView
      activeTab={activeTab}
      onTabChange={setActiveTab}
      friendsData={friendsQuery.data || []}
      friendsLoading={friendsQuery.isLoading}
      friendsError={friendsQuery.isError}
      receivedData={receivedQuery.data || []}
      receivedLoading={receivedQuery.isLoading}
      receivedError={receivedQuery.isError}
      sentData={sentQuery.data || []}
      sentLoading={sentQuery.isLoading}
      sentError={sentQuery.isError}
      searchData={searchQuery.data || []}
      searchLoading={searchQuery.isLoading}
      searchError={searchQuery.isError}
      searchControl={searchControl}
      searchErrors={searchErrors}
      onSearchSubmit={onSearchSubmit}
      submittedQuery={submittedQuery}
      onSendRequest={handleSendRequest}
      pendingRecipientIds={pendingRecipientIds}
      onAccept={handleAccept}
      onRefuse={handleRefuse}
      onRemove={handleRemove}
      sendMutationPending={sendMutation.isPending}
      acceptMutationPending={acceptMutation.isPending}
      refuseMutationPending={refuseMutation.isPending}
      removeMutationPending={removeMutation.isPending}
    />
  );
}
