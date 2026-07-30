import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import type { SentRequest } from "../types/friends-schema";

export function useSentRequests(enabled: boolean) {
  return useQuery({
    queryKey: ["friends", "sent"],
    queryFn: () => api.get<SentRequest[]>(API_ROUTES.friends.outgoing),
    enabled,
    retry: false,
  });
}
