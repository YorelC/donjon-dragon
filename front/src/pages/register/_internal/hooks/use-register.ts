import { useMutation } from "@tanstack/react-query";
import { api } from "../../../../shared/api/api";
import type { RegisterDto, PublicUser } from "@donjon-dragon/shared";

export function useRegister() {
  return useMutation({
    mutationFn: (dto: RegisterDto) => api.post<PublicUser>("/api/auth/register", dto),
  });
}
