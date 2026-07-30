import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError } from "@/shared/api/api";
import {
  RegisterFormSchema,
  type RegisterFormValues,
} from "../types/register-form-schema";
import { useRegister } from "./use-register";

export function useRegisterForm() {
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: {
      email: "",
      displayName: "",
      password: "",
      confirmPassword: "",
    },
  });
  const registerMutation = useRegister();

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage("");
    try {
      await registerMutation.mutateAsync({
        email: values.email,
        displayName: values.displayName,
        password: values.password,
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

  return {
    control,
    errors,
    onSubmit,
    isSubmitting: isSubmitting || registerMutation.isPending,
    errorMessage,
    success,
  };
}
