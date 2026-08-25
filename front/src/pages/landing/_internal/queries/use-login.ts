import { useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import type { AuthSession, LoginDto } from "@donjon-dragon/shared";

// La réponse ne contient que le profil : les deux tokens sont partis en cookies
// httpOnly, invisibles depuis la page.
export function useLogin() {
  return useMutation({
    mutationFn: (dto: LoginDto) =>
      api.post<AuthSession>(API_ROUTES.auth.login, dto),
  });
}
