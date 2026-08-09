import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';

import { CSRF_COOKIE } from '@donjon-dragon/shared/csrf-transport';

import { CsrfTokenService } from '@common/security/csrf-token.service';
import { REFRESH_TTL_MS } from '../domain/token/refresh-token';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

/** Le refresh token n'a besoin d'exister que sur les routes qui le consomment. */
const REFRESH_PATH = '/api/auth';

/**
 * Tous les cookies de session, décrits ici et nulle part ailleurs.
 *
 * Les deux secrets sont `httpOnly` : aucun script ne peut les lire, donc une
 * faille XSS ne permet plus de les exfiltrer — contrairement à `localStorage`.
 * Le jeton CSRF, lui, doit être lisible : le front le relit pour le renvoyer en
 * en-tête. C'est sa signature, pas son secret, qui le protège.
 *
 * `SameSite=Lax` : le cookie ne part pas sur une requête inter-site, ce qui bloque
 * le CSRF classique. Le CsrfGuard couvre le reste.
 */
@Injectable()
export class SessionCookies {
  private readonly secure: boolean;

  constructor(
    config: ConfigService,
    private readonly csrfTokens: CsrfTokenService,
  ) {
    this.secure = config.getOrThrow<boolean>('app.isProduction');
  }

  /** Ouvre ou renouvelle la session. Le jeton CSRF tourne à chaque fois. */
  issue(response: Response, userId: string, refreshToken: string, accessToken: string): void {
    response.cookie(ACCESS_COOKIE, accessToken, this.secretOptions());
    response.cookie(REFRESH_COOKIE, refreshToken, {
      ...this.secretOptions(REFRESH_TTL_MS),
      path: REFRESH_PATH,
    });
    // Non httpOnly, volontairement : le front doit pouvoir le lire.
    response.cookie(CSRF_COOKIE, this.csrfTokens.issue(userId), {
      ...this.baseOptions(REFRESH_TTL_MS),
      httpOnly: false,
    });
  }

  clear(response: Response): void {
    response.clearCookie(ACCESS_COOKIE, this.baseOptions());
    response.clearCookie(REFRESH_COOKIE, { ...this.baseOptions(), path: REFRESH_PATH });
    response.clearCookie(CSRF_COOKIE, { ...this.baseOptions(), httpOnly: false });
  }

  static presentedRefreshToken(request: Request): string {
    return request.cookies?.[REFRESH_COOKIE] ?? '';
  }

  private secretOptions(maxAge?: number): CookieOptions {
    return { ...this.baseOptions(maxAge), httpOnly: true };
  }

  private baseOptions(maxAge?: number): CookieOptions {
    return {
      httpOnly: true,
      secure: this.secure,
      sameSite: 'lax',
      path: '/',
      ...(maxAge === undefined ? {} : { maxAge }),
    };
  }
}
