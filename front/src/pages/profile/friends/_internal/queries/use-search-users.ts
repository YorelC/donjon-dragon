import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import type { PublicUser } from "@donjon-dragon/shared";

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ["friends", "search", query],
    queryFn: () => api.get<PublicUser[]>(API_ROUTES.friends.search(query)),
    enabled: !!query,
  });
}
