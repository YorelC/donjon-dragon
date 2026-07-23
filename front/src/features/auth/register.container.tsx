import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema, type RegisterDto } from "@donjon-dragon/shared";
import { ApiError } from "../../lib/api";
import { RegisterView } from "./register.view";
import { useRegister } from "./hooks/use-auth";

type RegisterFormValues = Omit<RegisterDto, "appOrigin">;

export function RegisterContainer() {
  const [success, setSuccess] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema.omit({ appOrigin: true })),
    defaultValues: { email: "", displayName: "", password: "" },
  });
  const registerMutation = useRegister();
  const [errorMessage, setErrorMessage] = useState<string>("");

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage("");
    try {
      await registerMutation.mutateAsync({
        ...values,
        appOrigin: window.location.origin,
      });
      reset();
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrorMessage("Cette adresse email est déjà utilisée.");
      } else {
        setErrorMessage("Erreur lors de l'inscription. Réessaye.");
      }
    }
  });

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
      isSubmitting={isSubmitting || registerMutation.isPending}
      errorMessage={errorMessage}
    />
  );
}
