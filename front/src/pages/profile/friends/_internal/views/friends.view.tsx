import type { ReactNode } from "react";
import { Badge } from "@/shared/components/atoms/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/atoms/tabs";

type FriendsTab = "friends" | "received" | "sent" | "search";

interface FriendsViewProps {
  activeTab: FriendsTab;
  onTabChange: (tab: FriendsTab) => void;
  friendsPanel: ReactNode;
  receivedPanel: ReactNode;
  sentPanel: ReactNode;
  searchPanel: ReactNode;
  receivedBadge?: string;
}

export function FriendsView({
  activeTab,
  onTabChange,
  friendsPanel,
  receivedPanel,
  sentPanel,
  searchPanel,
  receivedBadge,
}: FriendsViewProps) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="section-title text-2xl mb-6">Amis</h1>
      <Tabs
        value={activeTab}
        onValueChange={(tab) => onTabChange(tab as FriendsTab)}
      >
        <FriendsTabsList receivedBadge={receivedBadge} />
        <TabsContent value="friends" className="mt-6">
          {friendsPanel}
        </TabsContent>
        <TabsContent value="received" className="mt-6">
          {receivedPanel}
        </TabsContent>
        <TabsContent value="sent" className="mt-6">
          {sentPanel}
        </TabsContent>
        <TabsContent value="search" className="mt-6">
          {searchPanel}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FriendsTabsList({ receivedBadge }: { receivedBadge?: string }) {
  return (
    <TabsList className="grid w-full grid-cols-4">
      <TabsTrigger value="friends">Amis</TabsTrigger>
      <TabsTrigger value="received">
        Reçues
        {receivedBadge && <Badge variant="secondary" className="ml-1">{receivedBadge}</Badge>}
      </TabsTrigger>
      <TabsTrigger value="sent">Envoyées</TabsTrigger>
      <TabsTrigger value="search">Chercher</TabsTrigger>
    </TabsList>
  );
}
