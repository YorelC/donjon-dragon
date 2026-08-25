import { z } from 'zod';

/**
 * Contrat de l'environnement, valide au demarrage. Aucune valeur par defaut
 * pour un secret : un JWT_SECRET absent doit faire echouer le boot, pas
 * retomber silencieusement sur une valeur connue publiquement.
 */
const EnvSchema = z.object({
  // Decide du flag `secure` des cookies de session : en production ils ne
  // doivent voyager que sur HTTPS.
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  MONGODB_URI: z.string().min(1),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET doit faire au moins 32 caracteres'),
  ACCESS_TOKEN_TTL: z.string().min(1).default('15m'),

  // Cout du hash de mot de passe. bcryptjs est du JS pur, donc plus lent que
  // le binding natif : 12 est un compromis raisonnable ici.
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  // Garde-fou global. Les routes auth resserrent la limite par decorateur :
  // c'est une constante de securite, pas un reglage de deploiement.
  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(300),

  EMAIL_USER: z.string().min(1),
  EMAIL_APP_PASSWORD: z.string().min(1),
  EMAIL_CAPTURE_PATH: z.string().min(1).optional(),

  /**
   * Origines autorisees, separees par des virgules.
   *
   * Une LISTE et non un joker : des que `credentials: true` est active, le
   * navigateur refuse `Access-Control-Allow-Origin: *`. Il faut donc renvoyer
   * l'origine exacte de l'appelant, ce qui suppose de savoir lesquelles sont
   * legitimes.
   */
  CORS_ORIGINS: z
    .string()
    .min(1)
    .default('http://localhost:5173')
    .transform((value) => value.split(',').map((origin) => origin.trim())),
}).superRefine((env, context) => {
  if (!env.EMAIL_CAPTURE_PATH || env.NODE_ENV === 'test') return;
  context.addIssue({
    code: z.ZodIssueCode.custom,
    path: ['EMAIL_CAPTURE_PATH'],
    message: 'EMAIL_CAPTURE_PATH est réservé aux tests',
  });
});

type Env = z.infer<typeof EnvSchema>;

/**
 * Mémoïsé sur l'objet d'environnement reçu : ConfigModule appelle `validate`, et
 * chaque namespace de configuration.ts revalide ensuite. Sans ce cache,
 * l'environnement était parsé six fois au démarrage pour un résultat identique.
 */
const cache = new WeakMap<object, Env>();

export function validateEnv(raw: Record<string, unknown>): Env {
  const cached = cache.get(raw);
  if (cached) return cached;

  const result = EnvSchema.safeParse(raw);
  if (!result.success) throw new Error(formatIssues(result.error));

  cache.set(raw, result.data);
  return result.data;
}

function formatIssues(error: z.ZodError): string {
  const lines = error.issues.map(
    (issue) => `  - ${issue.path.join('.')} : ${issue.message}`,
  );
  return `Configuration d'environnement invalide :\n${lines.join('\n')}`;
}
