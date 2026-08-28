import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/atoms/tabs";
import type { FriendsTab } from "../hooks/use-friends-tabs";
import type { FriendsCounts } from "../hooks/use-friends-counts";
import { FriendsListContainer } from "../containers/friends-list.container";
import { ReceivedRequestsContainer } from "../containers/received-requests.container";
import { SentRequestsContainer } from "../containers/sent-requests.container";
import { SearchUsersContainer } from "../containers/search-users.container";
import { ReceivedCountBadgeContainer } from "../containers/received-count-badge.container";

interface FriendsViewProps {
  activeTab: FriendsTab;
  onTabChange: (tab: FriendsTab) => void;
  counts: FriendsCounts;
}

export function FriendsView({ activeTab, onTabChange, counts }: FriendsViewProps) {
  return (
    <div className="flex max-w-[880px] flex-col gap-6">
      <FriendsHeading />
      <Tabs
        value={activeTab}
        onValueChange={(tab) => onTabChange(tab as FriendsTab)}
      >
        <FriendsTabsList counts={counts} />
        <FriendsTabsPanels />
      </Tabs>
    </div>
  );
}

function FriendsHeading() {
  return (
    <div>
      <span className="eyebrow">Gestion des compagnons</span>
      <h1 className="page-title mt-1.5">Amis</h1>
    </div>
  );
}

function FriendsTabsList({ counts }: { counts: FriendsCounts }) {
  return (
    <TabsList variant="box">
      <FriendsTab value="friends" label="Amis">
        <TabCount count={counts.friends} />
      </FriendsTab>
      <FriendsTab value="received" label="Reçues">
        <ReceivedCountBadgeContainer />
      </FriendsTab>
      <FriendsTab value="sent" label="Envoyées">
        <TabCount count={counts.sent} />
      </FriendsTab>
      <FriendsTab value="search" label="Chercher" />
    </TabsList>
  );
}

interface FriendsTabProps {
  value: FriendsTab;
  label: string;
  children?: React.ReactNode;
}

function FriendsTab({ value, label, children }: FriendsTabProps) {
  return (
    <TabsTrigger value={value}>
      {label}
      {children}
    </TabsTrigger>
  );
}

/** Un décompte nul ne mérite pas d'être affiché : la liste vide le dira. */
function TabCount({ count }: { count: number }) {
  if (count === 0) return null;

  return <span className="muted-text-xs">{count}</span>;
}

function FriendsTabsPanels() {
  return (
    <>
      <TabsContent value="friends" className="mt-4">
        <FriendsListContainer />
      </TabsContent>
      <TabsContent value="received" className="mt-4">
        <ReceivedRequestsContainer />
      </TabsContent>
      <TabsContent value="sent" className="mt-4">
        <SentRequestsContainer />
      </TabsContent>
      <TabsContent value="search" className="mt-4">
        <SearchUsersContainer />
      </TabsContent>
    </>
  );
}
