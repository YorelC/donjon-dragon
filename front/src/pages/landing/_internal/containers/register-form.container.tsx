import { RegisterFormView } from "../views/register-form.view";
import { useRegisterForm } from "../hooks/use-register-form";

export function RegisterFormContainer() {
  const { form, success } = useRegisterForm();

  return <RegisterFormView form={form} showSuccessMessage={success} />;
}
