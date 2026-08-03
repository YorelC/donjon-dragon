import type { ReactNode } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/atoms/tabs";
import { Badge } from "@/shared/components/atoms/badge";

type FriendsTab = "friends" | "received" | "sent" | "search";

interface FriendsViewProps {
  activeTab: FriendsTab;
  onTabChange: (tab: FriendsTab) => void;
  receivedCount?: number;
  friendsPanel: ReactNode;
  receivedPanel: ReactNode;
  sentPanel: ReactNode;
  searchPanel: ReactNode;
}

export function FriendsView({
  activeTab,
  onTabChange,
  receivedCount,
  friendsPanel,
  receivedPanel,
  sentPanel,
  searchPanel,
}: FriendsViewProps) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="section-title text-2xl mb-6">Amis</h1>
      <Tabs
        value={activeTab}
        onValueChange={(tab) => onTabChange(tab as FriendsTab)}
      >
        <FriendsTabsList receivedCount={receivedCount} />
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

function FriendsTabsList({
  receivedCount,
}: {
  receivedCount?: number;
}) {
  return (
    <TabsList className="grid w-full grid-cols-4">
      <TabsTrigger value="friends">Amis</TabsTrigger>
      <TabsTrigger value="received">
        Reçues
        {receivedCount !== undefined && receivedCount > 0 && (
          <Badge
            variant="default"
            aria-label={
              receivedCount > 9
                ? "Plus de 9 demandes en attente"
                : `${receivedCount} demandes en attente`
            }
          >
            {receivedCount > 9 ? "9+" : receivedCount}
          </Badge>
        )}
      </TabsTrigger>
      <TabsTrigger value="sent">Envoyées</TabsTrigger>
      <TabsTrigger value="search">Chercher</TabsTrigger>
    </TabsList>
  );
}
