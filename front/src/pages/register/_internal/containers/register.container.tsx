import { RegisterView } from "../views/register.view";
import { useRegisterForm } from "../hooks/use-register-form";

export function RegisterContainer() {
  const { control, errors, onSubmit, isSubmitting, errorMessage, success } =
    useRegisterForm();

  if (success) {
    return (
      <RegisterView
        showSuccessMessage
        control={control}
        errors={errors}
        onFormSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <RegisterView
      control={control}
      errors={errors}
      onFormSubmit={onSubmit}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
    />
  );
}
