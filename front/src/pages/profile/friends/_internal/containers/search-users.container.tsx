import { useSearchForm } from "../hooks/use-search-form";
import { useUserInvitation } from "../hooks/use-user-invitation";
import { useSearchUsers } from "../queries/use-search-users";
import { SearchUsersView } from "../views/search-users.view";

export function SearchUsersContainer() {
  const search = useSearchForm();
  const searchQuery = useSearchUsers(search.submittedQuery);
  const invitation = useUserInvitation();

  return (
    <SearchUsersView
      results={{
        data: searchQuery.data ?? [],
        loading: searchQuery.isLoading,
        error: searchQuery.isError,
      }}
      search={search}
      invitation={invitation}
    />
  );
}
