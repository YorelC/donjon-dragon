import { Controller } from "react-hook-form";
import type { UserSummary } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { ScrollArea } from "@/shared/components/atoms/scroll-area";
import { FormTextInput } from "@/shared/components/molecules/form-text-input";
import type { QueryState } from "@/shared/types/ui-state";
import type { UserSearch } from "../hooks/use-search-form";
import type { SearchPagination } from "../hooks/use-infinite-scroll-trigger";
import type { UserInvitation } from "../hooks/use-user-invitation";
import { FriendRow } from "./friend-row.view";
import { toSearchResultMeta } from "../utils/friend-meta";

interface SearchUsersViewProps {
  results: QueryState<UserSummary[]>;
  pagination: SearchPagination;
  search: UserSearch;
  invitation: UserInvitation;
}

export function SearchUsersView({
  results,
  pagination,
  search,
  invitation,
}: SearchUsersViewProps) {
  return (
    <div className="flex flex-col gap-5">
      <SearchQueryField search={search} />
      {search.submittedQuery && (
        <SearchResults
          results={results}
          pagination={pagination}
          invitation={invitation}
        />
      )}
    </div>
  );
}

function SearchQueryField({ search }: { search: UserSearch }) {
  return (
    <Controller
      name="query"
      control={search.control}
      render={({ field }) => (
        <div className="max-w-[420px]">
          <FormTextInput
            label="Rechercher un joueur"
            placeholder="Pseudonyme"
            field={field}
            error={search.errors.query?.message}
          />
        </div>
      )}
    />
  );
}

interface SearchResultsProps {
  results: QueryState<UserSummary[]>;
  pagination: SearchPagination;
  invitation: UserInvitation;
}

function SearchResults({ results, pagination, invitation }: SearchResultsProps) {
  if (results.loading)
    return <div className="empty-state-text">Chargement...</div>;
  if (results.error)
    return <div className="empty-state-text">Erreur lors de la recherche.</div>;
  if (results.data.length === 0) {
    return (
      <div className="empty-state-text">
        Aucun joueur ne correspond à cette recherche.
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      <div className="flex flex-col gap-2.5">
        {results.data.map((user) => (
          <UserSearchResultRow
            key={user.displayName}
            user={user}
            invitation={invitation}
          />
        ))}
        <InfiniteScrollSentinel pagination={pagination} />
      </div>
    </ScrollArea>
  );
}

function InfiniteScrollSentinel({ pagination }: { pagination: SearchPagination }) {
  if (!pagination.hasNextPage) return null;

  return (
    <div ref={pagination.sentinelRef} className="empty-state-text py-2 text-center">
      {pagination.isFetchingNextPage ? "Chargement..." : ""}
    </div>
  );
}

interface UserSearchResultRowProps {
  user: UserSummary;
  invitation: UserInvitation;
}

function UserSearchResultRow({ user, invitation }: UserSearchResultRowProps) {
  return (
    <FriendRow name={user.displayName} meta={toSearchResultMeta()} tone="distant">
      <InvitationAction user={user} invitation={invitation} />
    </FriendRow>
  );
}

/** Trois états s'excluent : déjà ami, déjà invité, ou encore invitable. */
const INVITATION_ACTIONS: Record<
  InvitationStatus,
  (props: UserSearchResultRowProps) => JSX.Element
> = {
  friend: () => <span className="pill">Déjà ami</span>,
  invited: () => <Button disabled>Invitation envoyée</Button>,
  invitable: InviteButton,
};

function InvitationAction(props: UserSearchResultRowProps) {
  return INVITATION_ACTIONS[toInvitationStatus(props)](props);
}

function InviteButton({ user, invitation }: UserSearchResultRowProps) {
  const isSending = invitation.sendingTo === user.displayName;

  return (
    <Button onClick={() => invitation.onSend(user.displayName)} disabled={isSending}>
      {isSending ? "Envoi..." : "Inviter"}
    </Button>
  );
}

type InvitationStatus = "friend" | "invited" | "invitable";

function toInvitationStatus({
  user,
  invitation,
}: UserSearchResultRowProps): InvitationStatus {
  if (invitation.friendNames.has(user.displayName)) return "friend";
  if (invitation.pendingRecipients.has(user.displayName)) return "invited";
  return "invitable";
}
