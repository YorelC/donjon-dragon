import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/atoms/tabs";
import type { FriendsTab } from "../hooks/use-friends-tabs";
import { FriendsListContainer } from "../containers/friends-list.container";
import { ReceivedRequestsContainer } from "../containers/received-requests.container";
import { SentRequestsContainer } from "../containers/sent-requests.container";
import { SearchUsersContainer } from "../containers/search-users.container";
import { ReceivedCountBadgeContainer } from "../containers/received-count-badge.container";

interface FriendsViewProps {
  activeTab: FriendsTab;
  onTabChange: (tab: FriendsTab) => void;
}

export function FriendsView({ activeTab, onTabChange }: FriendsViewProps) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="section-title text-2xl mb-6">Amis</h1>
      <Tabs
        value={activeTab}
        onValueChange={(tab) => onTabChange(tab as FriendsTab)}
      >
        <FriendsTabsList />
        <TabsContent value="friends" className="mt-6">
          <FriendsListContainer />
        </TabsContent>
        <TabsContent value="received" className="mt-6">
          <ReceivedRequestsContainer />
        </TabsContent>
        <TabsContent value="sent" className="mt-6">
          <SentRequestsContainer />
        </TabsContent>
        <TabsContent value="search" className="mt-6">
          <SearchUsersContainer />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FriendsTabsList() {
  return (
    <TabsList className="grid w-full grid-cols-4">
      <TabsTrigger value="friends">Amis</TabsTrigger>
      <TabsTrigger value="received">
        Reçues
        <ReceivedCountBadgeContainer />
      </TabsTrigger>
      <TabsTrigger value="sent">Envoyées</TabsTrigger>
      <TabsTrigger value="search">Chercher</TabsTrigger>
    </TabsList>
  );
}
