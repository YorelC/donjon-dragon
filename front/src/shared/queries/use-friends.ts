import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import type { AcceptedFriend } from "@/shared/types/friend";

export const FRIENDS_LIST_KEY = ["friends", "list"] as const;

export function useFriends(enabled: boolean) {
  return useQuery({
    queryKey: FRIENDS_LIST_KEY,
    queryFn: () => api.get<AcceptedFriend[]>(API_ROUTES.friends.list),
    enabled,
    retry: false,
  });
}
