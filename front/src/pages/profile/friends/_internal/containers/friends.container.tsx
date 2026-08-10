import { useFriendsTabs } from "../hooks/use-friends-tabs";
import { FriendsView } from "../views/friends.view";

export function FriendsContainer() {
  const { activeTab, setActiveTab } = useFriendsTabs();

  return <FriendsView activeTab={activeTab} onTabChange={setActiveTab} />;
}
