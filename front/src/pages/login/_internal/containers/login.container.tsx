import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginDto } from "@donjon-dragon/shared";
import { ApiError } from "../../../../shared/api/api";
import { useAuthStore } from "../../../../shared/stores/auth.store";
import { ROUTES } from "../../../../shared/constants/routes";
import { LoginView } from "../views/login.view";
import { useLogin } from "../hooks/use-login";

export function LoginContainer() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });
  const loginMutation = useLogin();

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage("");
    try {
      const tokens = await loginMutation.mutateAsync(values);
      setAuth(tokens);
      navigate(ROUTES.campaigns);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setErrorMessage("Ton email n'est pas encore vérifié. Vérifie ta boîte mail.");
      } else if (err instanceof ApiError && err.status === 401) {
        setErrorMessage("Email ou mot de passe incorrect.");
      } else {
        setErrorMessage("Erreur lors de la connexion. Réessaye.");
      }
    }
  });

  return (
    <LoginView
      control={control}
      errors={errors}
      onFormSubmit={onSubmit}
      isSubmitting={isSubmitting || loginMutation.isPending}
      errorMessage={errorMessage}
    />
  );
}
