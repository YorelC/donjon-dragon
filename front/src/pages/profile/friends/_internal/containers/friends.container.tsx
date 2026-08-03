import { useFriendsTabs } from "../hooks/use-friends-tabs";
import { useReceivedRequests } from "../queries/use-received-requests";
import { FriendsView } from "../views/friends.view";
import { FriendsListContainer } from "./friends-list.container";
import { ReceivedRequestsContainer } from "./received-requests.container";
import { SentRequestsContainer } from "./sent-requests.container";
import { SearchUsersContainer } from "./search-users.container";

function countBadgeLabel(count: number): string | undefined {
  if (count === 0) return undefined;
  return count > 9 ? "9+" : count.toString();
}

function useBadgeLabel() {
  const receivedQuery = useReceivedRequests();
  return countBadgeLabel(receivedQuery.data?.length ?? 0);
}

export function FriendsContainer() {
  const { activeTab, setActiveTab } = useFriendsTabs();
  const badgeLabel = useBadgeLabel();
  const receivedQuery = useReceivedRequests();

  const onTabChange = (tab: "friends" | "received" | "sent" | "search") => {
    if (tab === "received") receivedQuery.refetch();
    setActiveTab(tab);
  };

  return (
    <FriendsView
      activeTab={activeTab}
      onTabChange={onTabChange}
      friendsPanel={<FriendsListContainer />}
      receivedPanel={<ReceivedRequestsContainer />}
      sentPanel={<SentRequestsContainer />}
      searchPanel={<SearchUsersContainer />}
      receivedBadge={badgeLabel ?? undefined}
    />
  );
}
