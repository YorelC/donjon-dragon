import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginDto } from "@donjon-dragon/shared";
import { ApiError } from "@/shared/api/api";
import { useAuthStore } from "@/shared/stores/auth.store";
import { ROUTES } from "@/shared/constants/routes";
import type { FormState } from "@/shared/types/ui-state";
import { useLogin } from "../queries/use-login";

export function useLoginForm(): FormState<LoginDto> {
  const form = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { submit, isPending, errorMessage } = useLoginSubmit();

  return {
    control: form.control,
    errors: form.formState.errors,
    onSubmit: form.handleSubmit(submit),
    isSubmitting: form.formState.isSubmitting || isPending,
    errorMessage,
  };
}

function useLoginSubmit() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const loginMutation = useLogin();
  const [errorMessage, setErrorMessage] = useState<string>("");

  const submit = async (values: LoginDto) => {
    setErrorMessage("");
    try {
      setAuth(await loginMutation.mutateAsync(values));
      navigate(ROUTES.campaigns);
    } catch (err) {
      setErrorMessage(toLoginErrorMessage(err));
    }
  };

  return { submit, isPending: loginMutation.isPending, errorMessage };
}

function toLoginErrorMessage(err: unknown): string {
  if (err instanceof ApiError && err.status === 403) {
    return "Ton email n'est pas encore vérifié. Vérifie ta boîte mail.";
  }
  if (err instanceof ApiError && err.status === 401) {
    return "Email ou mot de passe incorrect.";
  }
  return "Erreur lors de la connexion. Réessaye.";
}
