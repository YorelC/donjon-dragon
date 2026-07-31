import { RegisterView } from "../views/register.view";
import { useRegisterForm } from "../hooks/use-register-form";

export function RegisterContainer() {
  const { control, errors, onSubmit, isSubmitting, errorMessage, success } =
    useRegisterForm();

  return (
    <RegisterView
      showSuccessMessage={success}
      control={control}
      errors={errors}
      onFormSubmit={onSubmit}
      isSubmitting={isSubmitting}
      errorMessage={success ? undefined : errorMessage}
    />
  );
}
