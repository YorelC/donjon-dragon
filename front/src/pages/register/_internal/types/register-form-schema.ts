import { z } from "zod";
import { RegisterSchema } from "@donjon-dragon/shared";

export const RegisterFormSchema = RegisterSchema.omit({ appOrigin: true })
  .extend({
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof RegisterFormSchema>;
