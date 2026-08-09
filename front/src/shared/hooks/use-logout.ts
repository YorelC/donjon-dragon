import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { ROUTES } from "@/shared/constants/routes";
import { useAuthStore } from "@/shared/stores/auth.store";

// Déconnexion complète : le serveur révoque le refresh token et efface les trois
// cookies, le store local est vidé quoi qu'il arrive, puis retour à l'accueil.
export function useLogout() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { mutate } = useRevokeSession();

  return () => {
    mutate(undefined, {
      onSettled: () => {
        clearAuth();
        navigate(ROUTES.home);
      },
    });
  };
}

// Aucun corps : le refresh token à révoquer est celui du cookie, et l'identité
// vient de l'access token. Le front n'a plus rien à transmettre.
function useRevokeSession() {
  return useMutation({
    mutationFn: () => api.post<void>(API_ROUTES.auth.logout),
  });
}
