import { describe, it, expect } from 'vitest';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';
import { AuthController } from './auth.controller';

/**
 * Le JwtAuthGuard est monté en APP_GUARD : la protection ne s'assert pas par la
 * présence d'un @UseGuards, mais par l'ABSENCE de @Public(). C'est le controller
 * où l'invariant compte le plus — il porte à la fois les seules routes ouvertes
 * au monde et deux routes qui ne doivent jamais le devenir.
 */
describe('AuthController — protection des routes', () => {
  /** Ouvertes à dessein : l'appelant n'a pas encore, ou plus, d'access token. */
  const PUBLIC_ROUTES = ['register', 'login', 'verifyEmail', 'refresh'] as const;

  /** Fermées : elles exigent une identité déjà prouvée par le jeton. */
  const PROTECTED_ROUTES = ['logout', 'me'] as const;

  /** Helper de mise en cookie, pas un handler HTTP. */
  const NOT_A_ROUTE = ['constructor', 'openSession'];

  it('ne déclare pas @Public() au niveau du controller', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, AuthController)).toBeUndefined();
  });

  it.each(PROTECTED_ROUTES)('ne déclare pas @Public() sur %s', (route) => {
    const handler = AuthController.prototype[route];
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBeUndefined();
  });

  it.each(PUBLIC_ROUTES)('déclare bien @Public() sur %s', (route) => {
    const handler = AuthController.prototype[route];
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBe(true);
  });

  // Sans ça, une route ajoutée demain échapperait aux deux assertions ci-dessus.
  it('couvre bien toutes les routes du controller', () => {
    const handlers = Object.getOwnPropertyNames(AuthController.prototype).filter(
      (name) => !NOT_A_ROUTE.includes(name),
    );

    expect(handlers.sort()).toEqual([...PUBLIC_ROUTES, ...PROTECTED_ROUTES].sort());
  });
});
