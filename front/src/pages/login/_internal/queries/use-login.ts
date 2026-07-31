import { useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import type { LoginDto, AuthTokens } from "@donjon-dragon/shared";

export function useLogin() {
  return useMutation({
    mutationFn: (dto: LoginDto) =>
      api.post<AuthTokens>(API_ROUTES.auth.login, dto),
  });
}
