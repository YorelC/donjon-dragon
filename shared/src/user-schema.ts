import { z } from 'zod';

/**
 * Messages de validation, en français et au même endroit que les contraintes.
 *
 * Sans eux, Zod produit ses défauts anglais — « String must contain at least 3
 * character(s) » — affichés tels quels sous les champs d'une interface française.
 * Ils vivent ici et non dans le front parce que le back valide avec les MÊMES
 * schémas : un 400 renvoyé par l'API porte donc le même texte que le formulaire.
 */
export const DISPLAY_NAME_RULES = {
  min: 2,
  max: 50,
} as const;

export const PASSWORD_RULES = {
  min: 8,
  max: 128,
} as const;

export const displayNameField = () =>
  z
    .string()
    .min(DISPLAY_NAME_RULES.min, {
      message: `Le pseudo doit contenir au moins ${DISPLAY_NAME_RULES.min} caractères.`,
    })
    .max(DISPLAY_NAME_RULES.max, {
      message: `Le pseudo ne peut pas dépasser ${DISPLAY_NAME_RULES.max} caractères.`,
    });

export const passwordField = () =>
  z
    .string()
    .min(PASSWORD_RULES.min, {
      message: `Le mot de passe doit contenir au moins ${PASSWORD_RULES.min} caractères.`,
    })
    .max(PASSWORD_RULES.max, {
      message: `Le mot de passe ne peut pas dépasser ${PASSWORD_RULES.max} caractères.`,
    });

export const emailField = () =>
  z.string().email({ message: 'Adresse email invalide.' });

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: emailField(),
  displayName: displayNameField(),
  passwordHash: z.string(),
  emailVerified: z.boolean(),
  createdAt: z.string().datetime(),
});

// Ce que JE reçois de MOI-MÊME : login, register, /me. Jamais le hash.
export const PublicUserSchema = UserSchema.omit({ passwordHash: true });

/**
 * Ce qu'un joueur voit d'un AUTRE joueur, et rien de plus.
 *
 * Ni email, ni emailVerified, ni createdAt : aucun n'est nécessaire pour afficher
 * un ami ou un résultat de recherche. Ni identifiant non plus — `id` est une
 * donnée système, et le pseudo suffit à désigner quelqu'un puisqu'il est unique.
 */
export const UserSummarySchema = UserSchema.pick({ displayName: true });

export const RegisterSchema = z.object({
  email: emailField(),
  displayName: displayNameField(),
  password: passwordField(),
  // Origine (window.location.origin) envoyée par le front pour construire
  // le lien de vérification — marche en local/LAN/tunnel Cloudflare sans config.
  // Aucun message soigné : ce champ n'est pas saisi, un échec ici est un bug.
  appOrigin: z.string().url(),
});

export const LoginSchema = z.object({
  email: emailField(),
  password: passwordField(),
});

export type User = z.infer<typeof UserSchema>;
export type PublicUser = z.infer<typeof PublicUserSchema>;
export type UserSummary = z.infer<typeof UserSummarySchema>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
