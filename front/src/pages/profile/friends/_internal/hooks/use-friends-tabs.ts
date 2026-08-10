import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RECEIVED_COUNT_KEY } from "../queries/use-received-count";

export type FriendsTab = "friends" | "received" | "sent" | "search";

const RECEIVED_TAB: FriendsTab = "received";

export function useFriendsTabs() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FriendsTab>("friends");

  // Ouvrir l'onglet des demandes reçues revalide le compteur : il a pu bouger
  // côté serveur depuis le dernier fetch, que son staleTime laisse dormir.
  function selectTab(tab: FriendsTab) {
    setActiveTab(tab);
    if (tab === RECEIVED_TAB) {
      queryClient.invalidateQueries({ queryKey: RECEIVED_COUNT_KEY });
    }
  }

  return { activeTab, setActiveTab: selectTab };
}
