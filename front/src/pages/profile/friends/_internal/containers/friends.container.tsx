import { useFriendsTabs } from "../hooks/use-friends-tabs";
import type { FriendsTab } from "../hooks/use-friends-tabs";
import { FriendsView } from "../views/friends.view";
import { FriendsListContainer } from "./friends-list.container";
import { ReceivedRequestsContainer } from "./received-requests.container";
import { SentRequestsContainer } from "./sent-requests.container";
import { SearchUsersContainer } from "./search-users.container";
import { useReceivedCount } from "../queries/use-received-count";

export function FriendsContainer() {
  const { activeTab, setActiveTab } = useFriendsTabs();
  const { data: countData, refetch: refetchCount } = useReceivedCount();

  return (
    <FriendsView
      activeTab={activeTab}
      onTabChange={(value: string) => {
        setActiveTab(value as FriendsTab);
        if (value === "received") refetchCount();
      }}
      receivedCount={countData?.count}
      friendsPanel={<FriendsListContainer />}
      receivedPanel={<ReceivedRequestsContainer />}
      sentPanel={<SentRequestsContainer />}
      searchPanel={<SearchUsersContainer />}
    />
  );
}
