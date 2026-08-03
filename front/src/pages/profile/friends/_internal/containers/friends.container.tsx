import { useFriendsTabs } from "../hooks/use-friends-tabs";
import { FriendsView } from "../views/friends.view";
import { FriendsListContainer } from "./friends-list.container";
import { ReceivedRequestsContainer } from "./received-requests.container";
import { SentRequestsContainer } from "./sent-requests.container";
import { SearchUsersContainer } from "./search-users.container";

export function FriendsContainer() {
  const { activeTab, setActiveTab } = useFriendsTabs();

  return (
    <FriendsView
      activeTab={activeTab}
      onTabChange={setActiveTab}
      friendsPanel={<FriendsListContainer />}
      receivedPanel={<ReceivedRequestsContainer />}
      sentPanel={<SentRequestsContainer />}
      searchPanel={<SearchUsersContainer />}
    />
  );
}
