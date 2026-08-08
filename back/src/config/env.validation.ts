import { z } from 'zod';

/**
 * Contrat de l'environnement, valide au demarrage. Aucune valeur par defaut
 * pour un secret : un JWT_SECRET absent doit faire echouer le boot, pas
 * retomber silencieusement sur une valeur connue publiquement.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  MONGODB_URI: z.string().min(1),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET doit faire au moins 32 caracteres'),
  ACCESS_TOKEN_TTL: z.string().min(1).default('15m'),

  EMAIL_USER: z.string().min(1),
  EMAIL_APP_PASSWORD: z.string().min(1),

  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = EnvSchema.safeParse(raw);
  if (!result.success) throw new Error(formatIssues(result.error));
  return result.data;
}

function formatIssues(error: z.ZodError): string {
  const lines = error.issues.map(
    (issue) => `  - ${issue.path.join('.')} : ${issue.message}`,
  );
  return `Configuration d'environnement invalide :\n${lines.join('\n')}`;
}
