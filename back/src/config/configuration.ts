import { registerAs } from '@nestjs/config';

import { validateEnv } from './env.validation';

/**
 * Regroupe l'environnement valide en namespaces. Le reste du code lit
 * `config.getOrThrow('jwt.secret')` et ne touche jamais process.env.
 */
export const appConfig = registerAs('app', () => {
  const env = validateEnv(process.env);
  return { nodeEnv: env.NODE_ENV, port: env.PORT };
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
    corsOrigin: env.CORS_ORIGIN,
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
  };
});

export const configNamespaces = [
  appConfig,
  databaseConfig,
  jwtConfig,
  securityConfig,
  mailConfig,
];
