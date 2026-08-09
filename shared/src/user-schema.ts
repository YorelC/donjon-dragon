import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(2).max(50),
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
  email: z.string().email(),
  displayName: z.string().min(2).max(50),
  password: z.string().min(8).max(128),
  // Origine (window.location.origin) envoyée par le front pour construire
  // le lien de vérification — marche en local/LAN/tunnel Cloudflare sans config.
  appOrigin: z.string().url(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type User = z.infer<typeof UserSchema>;
export type PublicUser = z.infer<typeof PublicUserSchema>;
export type UserSummary = z.infer<typeof UserSummarySchema>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
