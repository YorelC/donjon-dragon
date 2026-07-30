import { useState } from "react";

type FriendsTab = "friends" | "received" | "sent" | "search";

export function useFriendsTabs() {
  const [activeTab, setActiveTab] = useState<FriendsTab>("friends");
  return { activeTab, setActiveTab };
}
