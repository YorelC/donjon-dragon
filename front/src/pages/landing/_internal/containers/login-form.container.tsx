import { LoginFormView } from "../views/login-form.view";
import { useLoginForm } from "../hooks/use-login-form";

export function LoginFormContainer() {
  const form = useLoginForm();

  return <LoginFormView form={form} />;
}
