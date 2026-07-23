import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../../../shared/stores/auth.store";
import { ROUTES } from "../../../../shared/constants/routes";
import { VerifyEmailView } from "../views/verify-email.view";
import { useVerifyEmail } from "../hooks/use-verify-email";

export function VerifyEmailContainer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const verifyEmailMutation = useVerifyEmail();
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setErrorMessage("Token de vérification manquant. Vérifie le lien dans ta boîte mail.");
      return;
    }

    verifyEmailMutation.mutate(token, {
      onSuccess: (tokens) => {
        setAuth(tokens);
        setTimeout(() => {
          navigate(ROUTES.characters);
        }, 1000);
      },
      onError: () => {
        setErrorMessage("Token invalide ou expiré. Réessaye de t'inscrire.");
      },
    });
  }, [searchParams, verifyEmailMutation, setAuth, navigate]);

  return (
    <VerifyEmailView
      isLoading={verifyEmailMutation.isPending}
      errorMessage={errorMessage}
    />
  );
}
