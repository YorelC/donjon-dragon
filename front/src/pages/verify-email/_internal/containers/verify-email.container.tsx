import { useSearchParams } from "react-router-dom";
import { VerifyEmailView } from "../views/verify-email.view";
import { useVerifyEmail } from "../queries/use-verify-email";
import { useVerifyEmailRedirect } from "../hooks/use-verify-email-redirect";

export function VerifyEmailContainer() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const verifyEmailQuery = useVerifyEmail(token);
  useVerifyEmailRedirect(verifyEmailQuery);

  const errorMessage = !token
    ? "Token de vérification manquant. Vérifie le lien dans ta boîte mail."
    : verifyEmailQuery.isError
      ? "Token invalide ou expiré. Réessaye de t'inscrire."
      : undefined;

  return (
    <VerifyEmailView
      isLoading={verifyEmailQuery.isFetching}
      errorMessage={errorMessage}
    />
  );
}
