import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/shared/components/atoms/alert";
import { ROUTES } from "@/shared/constants/routes";

export function RegistrationSuccessView() {
  return (
    <div className="auth-container">
      <Alert className="alert-success">
        <AlertDescription>
          Vérifie ta boîte mail pour activer ton compte.
        </AlertDescription>
      </Alert>
      <div className="auth-footer">
        <Link to={ROUTES.login} className="text-primary underline">
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
