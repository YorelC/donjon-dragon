import type { UserSummary } from "@donjon-dragon/shared";
import type { QueryState } from "@/shared/types/ui-state";
import { useSearchForm } from "../hooks/use-search-form";
import { useInfiniteScrollTrigger } from "../hooks/use-infinite-scroll-trigger";
import { useUserInvitation } from "../hooks/use-user-invitation";
import { useSearchUsers } from "../queries/use-search-users";
import { SearchUsersView } from "../views/search-users.view";

export function SearchUsersContainer() {
  const search = useSearchForm();
  const searchQuery = useSearchUsers(search.submittedQuery);
  const invitation = useUserInvitation();
  const pagination = useInfiniteScrollTrigger({
    hasNextPage: searchQuery.hasNextPage,
    isFetchingNextPage: searchQuery.isFetchingNextPage,
    onLoadMore: searchQuery.fetchNextPage,
  });

  return (
    <SearchUsersView
      results={toResultsState(searchQuery)}
      pagination={pagination}
      search={search}
      invitation={invitation}
    />
  );
}

function toResultsState(
  searchQuery: ReturnType<typeof useSearchUsers>,
): QueryState<UserSummary[]> {
  return {
    data: searchQuery.data ?? [],
    loading: searchQuery.isLoading,
    error: searchQuery.isError,
  };
}
