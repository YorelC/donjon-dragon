import { useFriendsTabs } from "../hooks/use-friends-tabs";
import { useFriendsCounts } from "../hooks/use-friends-counts";
import { FriendsView } from "../views/friends.view";

export function FriendsContainer() {
  const { activeTab, setActiveTab } = useFriendsTabs();
  const counts = useFriendsCounts();

  return (
    <FriendsView
      activeTab={activeTab}
      onTabChange={setActiveTab}
      counts={counts}
    />
  );
}
