import { LoginView } from "../views/login.view";
import { useLoginForm } from "../hooks/use-login-form";

export function LoginContainer() {
  const { control, errors, onSubmit, isSubmitting, errorMessage } =
    useLoginForm();

  return (
    <LoginView
      control={control}
      errors={errors}
      onFormSubmit={onSubmit}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
    />
  );
}
