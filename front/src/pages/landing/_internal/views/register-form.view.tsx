import { Button } from "@/shared/components/atoms/button";
import type { FormState } from "@/shared/types/ui-state";
import type { RegisterFormValues } from "../types/register-form-schema";
import { AuthTabBody, type AuthTabCopy } from "./auth-tab-body.view";
import { AuthFields, type AuthFieldDescriptor } from "./auth-fields.view";
import { FormErrorAlert } from "./form-error-alert.view";
import { RegistrationSuccessView } from "./registration-success.view";

const REGISTER_COPY: AuthTabCopy = {
  title: "Rejoignez la table",
  subtitle: "Créez un compte pour bâtir vos fiches et inviter votre groupe.",
  footNote:
    "En créant un compte, vous acceptez les conditions d'utilisation et la politique de confidentialité.",
};

const REGISTER_FIELDS: AuthFieldDescriptor<RegisterFormValues>[] = [
  {
    name: "displayName",
    label: "Nom d'aventurier",
    placeholder: "Vaelira Feuillegivre",
    autoComplete: "nickname",
  },
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
    autoComplete: "new-password",
  },
  {
    name: "confirmPassword",
    label: "Confirmation du mot de passe",
    type: "password",
    placeholder: "••••••••",
    autoComplete: "new-password",
  },
];

interface RegisterFormViewProps {
  form: FormState<RegisterFormValues>;
  showSuccessMessage: boolean;
}

export function RegisterFormView({ form, showSuccessMessage }: RegisterFormViewProps) {
  if (showSuccessMessage) return <RegistrationSuccessView />;

  return (
    <AuthTabBody copy={REGISTER_COPY}>
      <form onSubmit={form.onSubmit} className="mt-[26px] flex flex-col gap-4">
        <AuthFields fields={REGISTER_FIELDS} form={form} />
        <FormErrorAlert message={form.errorMessage} />
        <RegisterSubmitButton isSubmitting={form.isSubmitting} />
      </form>
    </AuthTabBody>
  );
}

function RegisterSubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
      {isSubmitting ? "Inscription..." : "Créer mon compte"}
    </Button>
  );
}
