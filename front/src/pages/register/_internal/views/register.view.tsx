import { Link } from "react-router-dom";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Button } from "@/shared/components/atoms/button";
import { FormTextInput } from "@/shared/components/molecules/form-text-input";
import { Alert, AlertDescription } from "@/shared/components/atoms/alert";
import { ROUTES } from "@/shared/constants/routes";
import type { RegisterFormValues } from "../types/register-form-schema";

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
        <RegisterField
          name="email"
          label="Adresse email"
          type="email"
          control={control}
          error={errors.email?.message}
        />

        <RegisterField
          name="displayName"
          label="Nom d'affichage"
          control={control}
          error={errors.displayName?.message}
        />

        <RegisterField
          name="password"
          label="Mot de passe"
          type="password"
          control={control}
          error={errors.password?.message}
        />

        <RegisterField
          name="confirmPassword"
          label="Confirmation du mot de passe"
          type="password"
          control={control}
          error={errors.confirmPassword?.message}
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

interface RegisterFieldProps {
  name: keyof RegisterFormValues;
  label: string;
  control: Control<RegisterFormValues>;
  error?: string;
  type?: string;
}

function RegisterField({
  name,
  label,
  control,
  error,
  type,
}: RegisterFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormTextInput label={label} field={field} type={type} error={error} />
      )}
    />
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
