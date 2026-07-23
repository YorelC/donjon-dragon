import { Link } from "react-router-dom";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Button } from "@/shared/components/atoms/button";
import { FormTextInput } from "@/shared/components/molecules/form-text-input";
import { Alert, AlertDescription } from "@/shared/components/atoms/alert";
import { ROUTES } from "@/shared/constants/routes";
import type { RegisterDto } from "@donjon-dragon/shared";

type RegisterFormValues = Omit<RegisterDto, "appOrigin">;

interface RegisterViewProps {
  control: Control<RegisterFormValues>;
  errors: FieldErrors<RegisterFormValues>;
  onFormSubmit: (event: React.FormEvent) => void;
  isSubmitting: boolean;
  errorMessage?: string;
  showSuccessMessage?: boolean;
}

export function RegisterView({
  control,
  errors,
  onFormSubmit,
  isSubmitting,
  errorMessage,
  showSuccessMessage,
}: RegisterViewProps) {
  if (showSuccessMessage) {
    return <RegistrationSuccess />;
  }

  return (
    <RegistrationForm
      control={control}
      errors={errors}
      onFormSubmit={onFormSubmit}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
    />
  );
}

function RegistrationSuccess() {
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

interface RegistrationFormProps {
  control: Control<RegisterFormValues>;
  errors: FieldErrors<RegisterFormValues>;
  onFormSubmit: (event: React.FormEvent) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}

function RegistrationForm({
  control,
  errors,
  onFormSubmit,
  isSubmitting,
  errorMessage,
}: RegistrationFormProps) {
  return (
    <div className="auth-container">
      <form onSubmit={onFormSubmit} className="flex flex-col gap-4">
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <FormTextInput
              label="Adresse email"
              field={field}
              type="email"
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          name="displayName"
          control={control}
          render={({ field }) => (
            <FormTextInput
              label="Nom d'affichage"
              field={field}
              error={errors.displayName?.message}
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <FormTextInput
              label="Mot de passe"
              field={field}
              type="password"
              error={errors.password?.message}
            />
          )}
        />

        {errorMessage && (
          <Alert className="alert-error">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Inscription..." : "S'inscrire"}
        </Button>
      </form>

      <RegistrationFooter />
    </div>
  );
}

function RegistrationFooter() {
  return (
    <div className="auth-footer">
      <span>Déjà inscrit ? </span>
      <Link to={ROUTES.login} className="text-primary underline">
        Se connecter
      </Link>
    </div>
  );
}
