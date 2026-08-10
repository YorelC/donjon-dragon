import { LoginView } from "../views/login.view";
import { useLoginForm } from "../hooks/use-login-form";

export function LoginContainer() {
  const form = useLoginForm();

  return <LoginView form={form} />;
}
