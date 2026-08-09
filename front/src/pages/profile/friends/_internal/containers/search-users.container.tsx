import { useSearchForm } from "../hooks/use-search-form";
import { useSearchUsers } from "../queries/use-search-users";
import { useSentRequests } from "../queries/use-sent-requests";
import { useSendFriendRequest } from "../queries/use-send-friend-request";
import type { SentRequest } from "../types/friends-schema";
import { SearchUsersView } from "../views/search-users.view";

export function SearchUsersContainer() {
  const { control, errors, onSubmit, submittedQuery } = useSearchForm();
  const searchQuery = useSearchUsers(submittedQuery);
  const sentQuery = useSentRequests(true);
  const sendMutation = useSendFriendRequest();

  return (
    <SearchUsersView
      data={searchQuery.data ?? []}
      loading={searchQuery.isLoading}
      error={searchQuery.isError}
      searchControl={control}
      searchErrors={errors}
      onSearchSubmit={onSubmit}
      submittedQuery={submittedQuery}
      onSendRequest={(displayName) => sendMutation.mutate(displayName)}
      pendingRecipients={toPendingRecipients(sentQuery.data)}
      sendMutationPending={sendMutation.isPending}
    />
  );
}

// Les demandes déjà envoyées désactivent le bouton « Ajouter » du résultat.
// Le rapprochement se fait par pseudo, qui porte un index unique en base : le
// serveur ne divulgue plus l'identifiant des autres joueurs.
function toPendingRecipients(requests: SentRequest[] | undefined): Set<string> {
  return new Set((requests ?? []).map((request) => request.recipient.displayName));
}
