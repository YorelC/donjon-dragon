import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/shared/components/atoms/alert";
import { ROUTES } from "@/shared/constants/routes";

interface VerifyEmailViewProps {
  isLoading: boolean;
  errorMessage?: string;
}

export function VerifyEmailView({
  isLoading,
  errorMessage,
}: VerifyEmailViewProps) {
  if (isLoading) {
    return <VerifyEmailLoading />;
  }

  if (errorMessage) {
    return <VerifyEmailError message={errorMessage} />;
  }

  return <VerifyEmailSuccess />;
}

function VerifyEmailLoading() {
  return (
    <div className="auth-container">
      <div className="text-center">
        <p className="muted-text">Vérification en cours...</p>
      </div>
    </div>
  );
}

interface VerifyEmailErrorProps {
  message: string;
}

function VerifyEmailError({ message }: VerifyEmailErrorProps) {
  return (
    <div className="auth-container">
      <Alert className="alert-error">
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <div className="auth-links">
        <Link to={ROUTES.login} className="text-primary underline">
          Connexion
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link to={ROUTES.register} className="text-primary underline">
          Inscription
        </Link>
      </div>
    </div>
  );
}

function VerifyEmailSuccess() {
  return (
    <div className="auth-container">
      <Alert className="alert-success">
        <AlertDescription>Email vérifié ! Redirection...</AlertDescription>
      </Alert>
    </div>
  );
}
