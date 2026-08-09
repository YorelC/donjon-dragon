import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { CSRF_COOKIE, CSRF_HEADER } from '@donjon-dragon/shared/csrf-transport';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { CsrfTokenService } from '../security/csrf-token.service';

// GET, HEAD, OPTIONS : ces methodes ne changent pas d'etat, donc rien a proteger.
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Seconde couche de défense contre le CSRF, empilée sur `SameSite=Lax`.
 *
 * `Lax` bloque déjà la requête inter-site classique, mais ne protège pas d'un
 * sous-domaine hostile capable d'écrire un cookie sur le domaine parent. Le jeton
 * signé couvre ce cas.
 *
 * Monté en APP_GUARD APRÈS le JwtAuthGuard : la vérification a besoin de
 * `request.user` pour confirmer que le jeton appartient bien à cette session.
 *
 * Les routes `@Public()` sont exemptées : avant de s'authentifier, le client n'a
 * pas encore de jeton. `SameSite=Lax` les couvre — une requête inter-site
 * n'emporte pas le cookie de session, donc `refresh` ne peut pas être déclenché
 * depuis un autre domaine.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly csrfTokens: CsrfTokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method)) return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    this.assertTokenMatchesSession(request);
    return true;
  }

  private assertTokenMatchesSession(request: Request): void {
    const fromCookie = request.cookies?.[CSRF_COOKIE];
    const fromHeader = request.header(CSRF_HEADER);

    // Double submit : le cookie seul ne suffit pas, puisque le navigateur
    // l'envoie tout seul. C'est la presence du MEME jeton en en-tete qui prouve
    // que du code de notre origine a pu le lire.
    if (!fromCookie || fromCookie !== fromHeader) {
      throw new ForbiddenException('Missing or mismatched CSRF token');
    }

    if (!this.csrfTokens.matches(fromCookie, request.user?.userId ?? '')) {
      throw new ForbiddenException('Invalid CSRF token');
    }
  }
}
