import type { Control, FieldErrors } from "react-hook-form";
import type { PublicUser } from "@donjon-dragon/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/atoms/tabs";
import type {
  ReceivedRequest,
  SentRequest,
  AcceptedFriend,
  SearchFormValues,
} from "../types/friends-schema";
import { FriendsListView } from "./friends-list.view";
import { ReceivedRequestsView } from "./received-requests.view";
import { SentRequestsView } from "./sent-requests.view";
import { SearchUsersView } from "./search-users.view";

type FriendsTab = "friends" | "received" | "sent" | "search";

interface FriendsViewProps {
  activeTab: FriendsTab;
  onTabChange: (tab: FriendsTab) => void;
  friendsData: AcceptedFriend[];
  friendsLoading: boolean;
  friendsError: boolean;
  receivedData: ReceivedRequest[];
  receivedLoading: boolean;
  receivedError: boolean;
  sentData: SentRequest[];
  sentLoading: boolean;
  sentError: boolean;
  searchData: PublicUser[];
  searchLoading: boolean;
  searchError: boolean;
  searchControl: Control<SearchFormValues>;
  searchErrors: FieldErrors<SearchFormValues>;
  onSearchSubmit: (e: React.FormEvent) => void;
  submittedQuery: string;
  onSendRequest: (displayName: string) => void;
  pendingRecipientIds: Set<string>;
  onAccept: (friendshipId: string) => void;
  onRefuse: (friendshipId: string) => void;
  onRemove: (friendshipId: string) => void;
  sendMutationPending: boolean;
  acceptMutationPending: boolean;
  refuseMutationPending: boolean;
  removeMutationPending: boolean;
}

export function FriendsView({
  activeTab,
  onTabChange,
  friendsData,
  friendsLoading,
  friendsError,
  receivedData,
  receivedLoading,
  receivedError,
  sentData,
  sentLoading,
  sentError,
  searchData,
  searchLoading,
  searchError,
  searchControl,
  searchErrors,
  onSearchSubmit,
  submittedQuery,
  onSendRequest,
  pendingRecipientIds,
  onAccept,
  onRefuse,
  onRemove,
  sendMutationPending,
  acceptMutationPending,
  refuseMutationPending,
  removeMutationPending,
}: FriendsViewProps) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="section-title text-2xl mb-6">Amis</h1>
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as FriendsTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="friends">Amis</TabsTrigger>
          <TabsTrigger value="received">Reçues</TabsTrigger>
          <TabsTrigger value="sent">Envoyées</TabsTrigger>
          <TabsTrigger value="search">Chercher</TabsTrigger>
        </TabsList>
        <TabsContent value="friends" className="mt-6">
          <FriendsListView
            friends={friendsData}
            loading={friendsLoading}
            error={friendsError}
            onRemove={onRemove}
            removeMutationPending={removeMutationPending}
          />
        </TabsContent>
        <TabsContent value="received" className="mt-6">
          <ReceivedRequestsView
            requests={receivedData}
            loading={receivedLoading}
            error={receivedError}
            onAccept={onAccept}
            onRefuse={onRefuse}
            acceptMutationPending={acceptMutationPending}
            refuseMutationPending={refuseMutationPending}
          />
        </TabsContent>
        <TabsContent value="sent" className="mt-6">
          <SentRequestsView
            requests={sentData}
            loading={sentLoading}
            error={sentError}
          />
        </TabsContent>
        <TabsContent value="search" className="mt-6">
          <SearchUsersView
            data={searchData}
            loading={searchLoading}
            error={searchError}
            searchControl={searchControl}
            searchErrors={searchErrors}
            onSearchSubmit={onSearchSubmit}
            submittedQuery={submittedQuery}
            onSendRequest={onSendRequest}
            pendingRecipientIds={pendingRecipientIds}
            sendMutationPending={sendMutationPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
