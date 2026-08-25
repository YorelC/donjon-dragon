import { registerAs } from '@nestjs/config';

import { validateEnv } from './env.validation';

/**
 * Regroupe l'environnement valide en namespaces. Le reste du code lit
 * `config.getOrThrow('jwt.secret')` et ne touche jamais process.env.
 */
export const appConfig = registerAs('app', () => {
  const env = validateEnv(process.env);
  return { port: env.PORT, isProduction: env.NODE_ENV === 'production' };
});

export const databaseConfig = registerAs('database', () => ({
  uri: validateEnv(process.env).MONGODB_URI,
}));

export const jwtConfig = registerAs('jwt', () => {
  const env = validateEnv(process.env);
  return {
    secret: env.JWT_SECRET,
    accessTokenTtl: env.ACCESS_TOKEN_TTL,
  };
});

export const securityConfig = registerAs('security', () => {
  const env = validateEnv(process.env);
  return {
    corsOrigins: env.CORS_ORIGINS,
    bcryptRounds: env.BCRYPT_ROUNDS,
    throttle: {
      ttl: env.THROTTLE_TTL_MS,
      limit: env.THROTTLE_LIMIT,
    },
  };
});

export const mailConfig = registerAs('mail', () => {
  const env = validateEnv(process.env);
  return {
    user: env.EMAIL_USER,
    appPassword: env.EMAIL_APP_PASSWORD,
    capturePath: env.EMAIL_CAPTURE_PATH,
  };
});

export const configNamespaces = [
  appConfig,
  databaseConfig,
  jwtConfig,
  securityConfig,
  mailConfig,
];
