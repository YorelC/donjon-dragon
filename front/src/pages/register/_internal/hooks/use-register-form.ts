import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DOMAIN_ERROR_CODE,
  type DomainErrorCode,
} from "@donjon-dragon/shared";
import { ApiError } from "@/shared/api/api";
import type { FormState } from "@/shared/types/ui-state";
import {
  RegisterFormSchema,
  type RegisterFormValues,
} from "../types/register-form-schema";
import { useRegister } from "../queries/use-register";

export interface RegisterFormState {
  form: FormState<RegisterFormValues>;
  success: boolean;
}

export function useRegisterForm(): RegisterFormState {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: EMPTY_REGISTER_FORM,
  });
  const { submit, isPending, errorMessage, success } = useRegisterSubmit(
    form.reset,
  );

  return {
    success,
    form: {
      control: form.control,
      errors: form.formState.errors,
      onSubmit: form.handleSubmit(submit),
      isSubmitting: form.formState.isSubmitting || isPending,
      // Le succes remplace le formulaire : garder l'erreur precedente
      // afficherait un message mort sous l'ecran de confirmation.
      errorMessage: success ? undefined : errorMessage,
    },
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

/**
 * Un 409 ne dit pas lequel des deux champs uniques est déjà pris. On lit donc le
 * code métier de l'erreur, et non son message : envoyer l'utilisateur changer son
 * email alors que c'est son pseudo qui collisionne le laisse tourner en rond.
 */
const REGISTER_CONFLICT_MESSAGES: Record<DomainErrorCode, string> = {
  [DOMAIN_ERROR_CODE["email-already-in-use"]]:
    "Cette adresse email est déjà utilisée.",
  [DOMAIN_ERROR_CODE["display-name-already-taken"]]:
    "Ce pseudo est déjà pris. Choisis-en un autre.",
};

/** Exportee pour etre testee directement : c'est une fonction pure. */
export function toRegisterErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return GENERIC_REGISTER_ERROR;

  if (err.code) return REGISTER_CONFLICT_MESSAGES[err.code];

  // Filet : un 409 sans code reste un doublon, on ne sait juste pas lequel.
  if (err.status === HTTP_CONFLICT) {
    return "Cet email ou ce pseudo est déjà utilisé.";
  }

  return GENERIC_REGISTER_ERROR;
}

const HTTP_CONFLICT = 409;
const GENERIC_REGISTER_ERROR = "Erreur lors de l'inscription. Réessaye.";
