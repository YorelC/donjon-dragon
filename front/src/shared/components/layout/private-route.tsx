import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/shared/stores/auth.store";
import { ROUTES } from "@/shared/constants/routes";

export function PrivateRoute() {
  const isAuthenticated = useAuthStore((s) => s.user !== null);

  return isAuthenticated ? <Outlet /> : <Navigate to={ROUTES.login} replace />;
}
