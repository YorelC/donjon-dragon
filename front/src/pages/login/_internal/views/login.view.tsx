import { Link } from "react-router-dom";
import { Controller } from "react-hook-form";
import { Button } from "@/shared/components/atoms/button";
import { FormTextInput } from "@/shared/components/molecules/form-text-input";
import { Alert, AlertDescription } from "@/shared/components/atoms/alert";
import { ROUTES } from "@/shared/constants/routes";
import type { FormState } from "@/shared/types/ui-state";
import type { LoginDto } from "@donjon-dragon/shared";

interface LoginViewProps {
  form: FormState<LoginDto>;
}

export function LoginView({ form }: LoginViewProps) {
  return (
    <div className="auth-container">
      <LoginForm form={form} />
      <LoginFooter />
    </div>
  );
}

function LoginForm({ form }: LoginViewProps) {
  return (
    <form onSubmit={form.onSubmit} className="flex flex-col gap-4">
      <LoginFields form={form} />
      <LoginErrorAlert message={form.errorMessage} />
      <LoginSubmitButton isSubmitting={form.isSubmitting} />
    </form>
  );
}

interface LoginFieldDescriptor {
  name: keyof LoginDto;
  label: string;
  type: string;
}

const LOGIN_FIELDS: LoginFieldDescriptor[] = [
  { name: "email", label: "Adresse email", type: "email" },
  { name: "password", label: "Mot de passe", type: "password" },
];

function LoginFields({ form }: LoginViewProps) {
  return (
    <>
      {LOGIN_FIELDS.map((field) => (
        <LoginField key={field.name} field={field} form={form} />
      ))}
    </>
  );
}

interface LoginFieldProps {
  field: LoginFieldDescriptor;
  form: FormState<LoginDto>;
}

function LoginField({ field, form }: LoginFieldProps) {
  return (
    <Controller
      name={field.name}
      control={form.control}
      render={({ field: controlled }) => (
        <FormTextInput
          label={field.label}
          field={controlled}
          type={field.type}
          error={form.errors[field.name]?.message}
        />
      )}
    />
  );
}

function LoginErrorAlert({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <Alert className="alert-error">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function LoginSubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? "Connexion..." : "Se connecter"}
    </Button>
  );
}

function LoginFooter() {
  return (
    <div className="auth-footer">
      <span>Pas de compte ? </span>
      <Link to={ROUTES.register} className="text-primary underline">
        S'inscrire
      </Link>
    </div>
  );
}
