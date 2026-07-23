import { useMutation } from "@tanstack/react-query";
import { api } from "../../../../shared/api/api";
import type { AuthTokens } from "@donjon-dragon/shared";

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) =>
      api.post<AuthTokens>("/api/auth/verify-email", { token }),
  });
}
