import { Navigate, Outlet } from "react-router-dom";
import { SESSION_STATUS, useAuthStore } from "@/shared/stores/auth.store";
import { ROUTES } from "@/shared/constants/routes";

/**
 * Trois états, pas deux — et c'est ce qui change avec les cookies `httpOnly`.
 *
 * Le front ne peut plus lire ses tokens : au premier rendu il ne SAIT pas s'il a
 * une session, il attend la réponse de /me. Rediriger pendant cette attente
 * déconnecterait l'utilisateur à chaque rechargement de page — un bug d'affichage
 * qui aurait l'air d'un bug d'authentification.
 */
export function PrivateRoute() {
  const status = useAuthStore((state) => state.status);

  if (status === SESSION_STATUS.unknown) {
    return <SessionPending />;
  }

  return status === SESSION_STATUS.authenticated ? (
    <Outlet />
  ) : (
    <Navigate to={ROUTES.login} replace />
  );
}

function SessionPending() {
  return (
    <p role="status" aria-live="polite" className="p-8 text-center">
      Chargement de ta session…
    </p>
  );
}
