import { Controller } from "react-hook-form";
import type { UserSummary } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { Card, CardContent } from "@/shared/components/atoms/card";
import { FormTextInput } from "@/shared/components/molecules/form-text-input";
import type { QueryState } from "@/shared/types/ui-state";
import type { UserSearch } from "../hooks/use-search-form";
import type { UserInvitation } from "../hooks/use-user-invitation";

interface SearchUsersViewProps {
  results: QueryState<UserSummary[]>;
  search: UserSearch;
  invitation: UserInvitation;
}

export function SearchUsersView({
  results,
  search,
  invitation,
}: SearchUsersViewProps) {
  return (
    <div className="space-y-6">
      <SearchForm search={search} />
      {search.submittedQuery && (
        <SearchResults results={results} invitation={invitation} />
      )}
    </div>
  );
}

function SearchForm({ search }: { search: UserSearch }) {
  return (
    <form onSubmit={search.onSubmit} className="flex gap-2">
      <div className="flex-1">
        <SearchQueryField search={search} />
      </div>
      <Button type="submit" className="self-end">
        Chercher
      </Button>
    </form>
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
  invitation: UserInvitation;
}

function SearchResults({ results, invitation }: SearchResultsProps) {
  if (results.loading)
    return <div className="empty-state-text">Chargement...</div>;
  if (results.error)
    return <div className="empty-state-text">Erreur lors de la recherche.</div>;
  if (results.data.length === 0) {
    return <div className="empty-state-text">Aucun résultat trouvé.</div>;
  }

  return (
    <div className="space-y-2">
      {results.data.map((user) => (
        <UserSearchResultRow
          key={user.displayName}
          user={user}
          invitation={invitation}
        />
      ))}
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
