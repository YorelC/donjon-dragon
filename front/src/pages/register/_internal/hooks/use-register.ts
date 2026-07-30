import { useMutation } from "@tanstack/react-query";
import { api } from "../../../../shared/api/api";
import { API_ROUTES } from "../../../../shared/constants/api-routes";
import type { RegisterDto, PublicUser } from "@donjon-dragon/shared";

export function useRegister() {
  return useMutation({
    mutationFn: (dto: RegisterDto) => api.post<PublicUser>(API_ROUTES.auth.register, dto),
  });
}
