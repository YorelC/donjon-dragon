import type { LoginDto } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import type { FormState } from "@/shared/types/ui-state";
import { AuthTabBody, type AuthTabCopy } from "./auth-tab-body.view";
import { AuthFields, type AuthFieldDescriptor } from "./auth-fields.view";
import { FormErrorAlert } from "./form-error-alert.view";

const LOGIN_COPY: AuthTabCopy = {
  title: "Content de vous revoir",
  subtitle: "Reprenez vos personnages là où vous les avez laissés.",
  footNote: "Pas encore de compte ? Choisissez « S'inscrire » ci-dessus.",
};

const LOGIN_FIELDS: AuthFieldDescriptor<LoginDto>[] = [
  {
    name: "email",
    label: "Adresse email",
    type: "email",
    placeholder: "vous@exemple.fr",
    autoComplete: "username",
  },
  {
    name: "password",
    label: "Mot de passe",
    type: "password",
    placeholder: "••••••••",
    autoComplete: "current-password",
    hint: "Oublié ? (bientôt)",
  },
];

interface LoginFormViewProps {
  form: FormState<LoginDto>;
}

export function LoginFormView({ form }: LoginFormViewProps) {
  return (
    <AuthTabBody copy={LOGIN_COPY}>
      <form onSubmit={form.onSubmit} className="mt-[26px] flex flex-col gap-4">
        <AuthFields fields={LOGIN_FIELDS} form={form} />
        <FormErrorAlert message={form.errorMessage} />
        <LoginSubmitButton isSubmitting={form.isSubmitting} />
      </form>
    </AuthTabBody>
  );
}

function LoginSubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
      {isSubmitting ? "Connexion..." : "Se connecter"}
    </Button>
  );
}
