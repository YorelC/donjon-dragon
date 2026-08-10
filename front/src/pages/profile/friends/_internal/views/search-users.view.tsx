import { Controller } from "react-hook-form";
import type { UserSummary } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { Card, CardContent } from "@/shared/components/atoms/card";
import { ScrollArea } from "@/shared/components/atoms/scroll-area";
import { FormTextInput } from "@/shared/components/molecules/form-text-input";
import type { QueryState } from "@/shared/types/ui-state";
import type { UserSearch } from "../hooks/use-search-form";
import type { SearchPagination } from "../hooks/use-infinite-scroll-trigger";
import type { UserInvitation } from "../hooks/use-user-invitation";

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
    <div className="space-y-6">
      <SearchQueryField search={search} />
      {search.submittedQuery && (
        <SearchResults results={results} pagination={pagination} invitation={invitation} />
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
        <FormTextInput
          label="Rechercher un joueur"
          field={field}
          error={search.errors.query?.message}
        />
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
    return <div className="empty-state-text">Aucun résultat trouvé.</div>;
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-2">
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
    <div ref={pagination.sentinelRef} className="py-2 text-center empty-state-text">
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
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <span className="font-medium">{user.displayName}</span>
        <SendInvitationButton user={user} invitation={invitation} />
      </CardContent>
    </Card>
  );
}

function SendInvitationButton({ user, invitation }: UserSearchResultRowProps) {
  const alreadyInvited = invitation.pendingRecipients.has(user.displayName);

  return (
    <Button
      onClick={() => invitation.onSend(user.displayName)}
      disabled={invitation.isPending || alreadyInvited}
      size="sm"
    >
      {toInvitationLabel(alreadyInvited, invitation.isPending)}
    </Button>
  );
}

function toInvitationLabel(alreadyInvited: boolean, isPending: boolean): string {
  if (alreadyInvited) return "Invitation envoyée";
  if (isPending) return "Envoi...";
  return "Envoyer";
}
