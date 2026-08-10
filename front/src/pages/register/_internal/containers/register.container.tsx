import { RegisterView } from "../views/register.view";
import { useRegisterForm } from "../hooks/use-register-form";

export function RegisterContainer() {
  const { form, success } = useRegisterForm();

  return <RegisterView form={form} showSuccessMessage={success} />;
}
