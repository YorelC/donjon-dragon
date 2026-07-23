import { useMutation } from "@tanstack/react-query";
import { api } from "../../../../shared/api/api";
import type { LoginDto, AuthTokens } from "@donjon-dragon/shared";

export function useLogin() {
  return useMutation({
    mutationFn: (dto: LoginDto) => api.post<AuthTokens>("/api/auth/login", dto),
  });
}
