import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import type { PendingReceivedCount } from "@donjon-dragon/shared";

export function useReceivedCount() {
  return useQuery({
    queryKey: ["friends", "received", "count"],
    queryFn: () =>
      api.get<PendingReceivedCount>(API_ROUTES.friends.incomingCount),
    staleTime: 30_000,
    retry: false,
  });
}