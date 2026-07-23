import { Link } from "react-router-dom";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Button } from "@/components/atoms/button";
import { FormTextInput } from "@/components/molecules/form-text-input";
import { Alert, AlertDescription } from "@/components/atoms/alert";
import type { LoginDto } from "@donjon-dragon/shared";

interface LoginViewProps {
  control: Control<LoginDto>;
  errors: FieldErrors<LoginDto>;
  onFormSubmit: (event: React.FormEvent) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}

export function LoginView({
  control,
  errors,
  onFormSubmit,
  isSubmitting,
  errorMessage,
}: LoginViewProps) {
  return (
    <div className="auth-container">
      <LoginForm
        control={control}
        errors={errors}
        onFormSubmit={onFormSubmit}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
      />
      <LoginFooter />
    </div>
  );
}

interface LoginFormProps {
  control: Control<LoginDto>;
  errors: FieldErrors<LoginDto>;
  onFormSubmit: (event: React.FormEvent) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}

function LoginForm({
  control,
  errors,
  onFormSubmit,
  isSubmitting,
  errorMessage,
}: LoginFormProps) {
  return (
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
        {isSubmitting ? "Connexion..." : "Se connecter"}
      </Button>
    </form>
  );
}

function LoginFooter() {
  return (
    <div className="auth-footer">
      <span>Pas de compte ? </span>
      <Link to="/register" className="text-primary underline">
        S'inscrire
      </Link>
    </div>
  );
}
