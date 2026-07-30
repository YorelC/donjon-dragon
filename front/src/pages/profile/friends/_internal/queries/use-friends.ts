import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import type { AcceptedFriend } from "../types/friends-schema";

export function useFriends(enabled: boolean) {
  return useQuery({
    queryKey: ["friends", "list"],
    queryFn: () => api.get<AcceptedFriend[]>(API_ROUTES.friends.list),
    enabled,
    retry: false,
  });
}
