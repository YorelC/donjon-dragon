import { useMutation } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import type { RegisterDto, LoginDto, PublicUser, AuthTokens } from "@donjon-dragon/shared";

export function useRegister() {
  return useMutation({
    mutationFn: (dto: RegisterDto) => api.post<PublicUser>("/api/auth/register", dto),
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (dto: LoginDto) => api.post<AuthTokens>("/api/auth/login", dto),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) =>
      api.post<AuthTokens>("/api/auth/verify-email", { token }),
  });
}
