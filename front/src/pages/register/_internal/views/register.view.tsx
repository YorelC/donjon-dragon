import { Link } from "react-router-dom";
import { Controller } from "react-hook-form";
import { Button } from "@/shared/components/atoms/button";
import { FormTextInput } from "@/shared/components/molecules/form-text-input";
import { Alert, AlertDescription } from "@/shared/components/atoms/alert";
import { ROUTES } from "@/shared/constants/routes";
import type { FormState } from "@/shared/types/ui-state";
import type { RegisterFormValues } from "../types/register-form-schema";
import { RegistrationSuccessView } from "./registration-success.view";

interface RegisterViewProps {
  form: FormState<RegisterFormValues>;
  showSuccessMessage?: boolean;
}

export function RegisterView({ form, showSuccessMessage }: RegisterViewProps) {
  if (showSuccessMessage) return <RegistrationSuccessView />;

  return <RegistrationForm form={form} />;
}

interface RegistrationFormProps {
  form: FormState<RegisterFormValues>;
}

function RegistrationForm({ form }: RegistrationFormProps) {
  return (
    <div className="auth-container">
      <form onSubmit={form.onSubmit} className="flex flex-col gap-4">
        <RegisterFields form={form} />
        <RegisterErrorAlert message={form.errorMessage} />
        <RegisterSubmitButton isSubmitting={form.isSubmitting} />
      </form>
      <RegistrationFooter />
    </div>
  );
}

interface RegisterFieldDescriptor {
  name: keyof RegisterFormValues;
  label: string;
  type?: string;
}

const REGISTER_FIELDS: RegisterFieldDescriptor[] = [
  { name: "email", label: "Adresse email", type: "email" },
  { name: "displayName", label: "Nom d'affichage" },
  { name: "password", label: "Mot de passe", type: "password" },
  { name: "confirmPassword", label: "Confirmation du mot de passe", type: "password" },
];

function RegisterFields({ form }: RegistrationFormProps) {
  return (
    <>
      {REGISTER_FIELDS.map((field) => (
        <RegisterField key={field.name} field={field} form={form} />
      ))}
    </>
  );
}

interface RegisterFieldProps {
  field: RegisterFieldDescriptor;
  form: FormState<RegisterFormValues>;
}

function RegisterField({ field, form }: RegisterFieldProps) {
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

function RegisterErrorAlert({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <Alert className="alert-error">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function RegisterSubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? "Inscription..." : "S'inscrire"}
    </Button>
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
