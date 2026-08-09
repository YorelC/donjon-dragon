import type { z } from "zod";
import { RegisterSchema, passwordField } from "@donjon-dragon/shared";

export const RegisterFormSchema = RegisterSchema.omit({ appOrigin: true })
  .extend({
    // Mêmes contraintes et mêmes messages que le champ mot de passe : c'est le
    // même mot de passe, saisi deux fois.
    confirmPassword: passwordField(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof RegisterFormSchema>;
