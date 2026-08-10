import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import type { UserSearchResult } from "@donjon-dragon/shared";

const FIRST_PAGE = 1;

export function useSearchUsers(query: string) {
  return useInfiniteQuery({
    queryKey: ["friends", "search", query],
    queryFn: ({ pageParam }) =>
      api.get<UserSearchResult>(API_ROUTES.friends.search(query, pageParam)),
    initialPageParam: FIRST_PAGE,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length + 1 : undefined,
    select: (data) => data.pages.flatMap((page) => page.items),
    enabled: !!query,
  });
}
