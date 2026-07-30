import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/shared/stores/auth.store";
import { ROUTES } from "@/shared/constants/routes";
import type { useVerifyEmail } from "../queries/use-verify-email";

export function useVerifyEmailRedirect(query: ReturnType<typeof useVerifyEmail>) {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (!query.isSuccess) return;
    setAuth(query.data);
    const timeoutId = setTimeout(() => navigate(ROUTES.campaigns), 1000);
    return () => clearTimeout(timeoutId);
  }, [query.isSuccess, query.data, navigate, setAuth]);
}
