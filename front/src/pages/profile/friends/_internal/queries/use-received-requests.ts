import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import type { ReceivedRequest } from "../types/friends-schema";

export function useReceivedRequests() {
  return useQuery({
    queryKey: ["friends", "received"],
    queryFn: () => api.get<ReceivedRequest[]>(API_ROUTES.friends.incoming),
    retry: false,
  });
}
