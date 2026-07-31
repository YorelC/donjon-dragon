import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError } from "@/shared/api/api";
import {
  RegisterFormSchema,
  type RegisterFormValues,
} from "../types/register-form-schema";
import { useRegister } from "../queries/use-register";

export function useRegisterForm() {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: EMPTY_REGISTER_FORM,
  });
  const { submit, isPending, errorMessage, success } = useRegisterSubmit(
    form.reset,
  );

  return {
    control: form.control,
    errors: form.formState.errors,
    onSubmit: form.handleSubmit(submit),
    isSubmitting: form.formState.isSubmitting || isPending,
    errorMessage,
    success,
  };
}

const EMPTY_REGISTER_FORM: RegisterFormValues = {
  email: "",
  displayName: "",
  password: "",
  confirmPassword: "",
};

function useRegisterSubmit(reset: () => void) {
  const registerMutation = useRegister();
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const submit = async (values: RegisterFormValues) => {
    setErrorMessage("");
    try {
      await registerMutation.mutateAsync(toRegisterDto(values));
      reset();
      setSuccess(true);
    } catch (err) {
      setErrorMessage(toRegisterErrorMessage(err));
    }
  };

  return { submit, isPending: registerMutation.isPending, errorMessage, success };
}

function toRegisterDto(values: RegisterFormValues) {
  return {
    email: values.email,
    displayName: values.displayName,
    password: values.password,
    appOrigin: window.location.origin,
  };
}

function toRegisterErrorMessage(err: unknown): string {
  if (err instanceof ApiError && err.status === 409) {
    return "Cette adresse email est déjà utilisée.";
  }
  return "Erreur lors de l'inscription. Réessaye.";
}
