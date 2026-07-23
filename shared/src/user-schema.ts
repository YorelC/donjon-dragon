import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(2).max(50),
  passwordHash: z.string(),
  emailVerified: z.boolean(),
  createdAt: z.string().datetime(),
});

// Ce que le client reçoit — jamais le hash de mot de passe.
export const PublicUserSchema = UserSchema.omit({ passwordHash: true });

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
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
