import { useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";

export function useLogout() {
  return useMutation({
    mutationFn: (refreshToken: string) =>
      api.post<void>(API_ROUTES.auth.logout, { refreshToken }),
  });
}
