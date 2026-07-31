import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { ROUTES } from "@/shared/constants/routes";
import { useAuthStore } from "@/shared/stores/auth.store";

// Déconnexion complète : révoque le refresh token côté serveur, vide le store
// local quoi qu'il arrive, puis ramène à l'accueil.
export function useLogout() {
  const navigate = useNavigate();
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { mutate } = useRevokeRefreshToken();

  return () => {
    mutate(refreshToken ?? "", {
      onSettled: () => {
        clearAuth();
        navigate(ROUTES.home);
      },
    });
  };
}

function useRevokeRefreshToken() {
  return useMutation({
    mutationFn: (refreshToken: string) =>
      api.post<void>(API_ROUTES.auth.logout, { refreshToken }),
  });
}
