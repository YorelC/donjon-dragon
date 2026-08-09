import { describe, expect, it } from 'vitest';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { CSRF_COOKIE, CSRF_HEADER } from '@donjon-dragon/shared/csrf-transport';

import { CsrfTokenService } from '../security/csrf-token.service';
import { CsrfGuard } from './csrf.guard';

const ALICE = '11111111-1111-4111-8111-111111111111';
const BOB = '22222222-2222-4222-8222-222222222222';

const csrfTokens = new CsrfTokenService({
  getOrThrow: () => 'un-secret-de-test-suffisamment-long-pour-hmac',
} as unknown as ConfigService);

interface RequestShape {
  method?: string;
  cookie?: string;
  header?: string;
  userId?: string;
}

function guardFor({ isPublic = false } = {}): CsrfGuard {
  return new CsrfGuard(
    { getAllAndOverride: () => isPublic } as unknown as Reflector,
    csrfTokens,
  );
}

function contextFor({
  method = 'POST',
  cookie,
  header,
  userId = ALICE,
}: RequestShape): ExecutionContext {
  const request = {
    method,
    cookies: cookie === undefined ? {} : { [CSRF_COOKIE]: cookie },
    header: (name: string) => (name === CSRF_HEADER ? header : undefined),
    user: userId === '' ? undefined : { userId },
  } as unknown as Request;

  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => () => undefined,
    getClass: () => class Controller {},
  } as unknown as ExecutionContext;
}

describe('CsrfGuard', () => {
  it('laisse passer une mutation dont le jeton est valide et recopie', () => {
    const token = csrfTokens.issue(ALICE);

    expect(
      guardFor().canActivate(contextFor({ cookie: token, header: token })),
    ).toBe(true);
  });

  // GET, HEAD et OPTIONS ne changent pas d'etat : les proteger n'apporterait rien
  // et casserait la navigation, puisque le front n'envoie pas d'en-tete dessus.
  describe('methodes sures', () => {
    it.each(['GET', 'HEAD', 'OPTIONS'])('laisse passer %s sans aucun jeton', (method) => {
      expect(guardFor().canActivate(contextFor({ method }))).toBe(true);
    });
  });

  // Avant de s'authentifier le client n'a pas encore de jeton. SameSite=Lax couvre
  // ces routes : une requete inter-site n'emporte pas le cookie de session.
  it('laisse passer une route @Public() sans jeton', () => {
    expect(
      guardFor({ isPublic: true }).canActivate(contextFor({ method: 'POST' })),
    ).toBe(true);
  });

  describe('refus', () => {
    it('refuse une mutation sans aucun jeton', () => {
      expect(() => guardFor().canActivate(contextFor({}))).toThrow(ForbiddenException);
    });

    it('refuse le cookie seul, sans en-tete', () => {
      const token = csrfTokens.issue(ALICE);

      // Le navigateur envoie le cookie tout seul : c'est la RECOPIE en en-tete qui
      // prouve qu'un script de notre origine a pu le lire.
      expect(() => guardFor().canActivate(contextFor({ cookie: token }))).toThrow(
        ForbiddenException,
      );
    });

    it('refuse l en-tete seul, sans cookie', () => {
      const token = csrfTokens.issue(ALICE);

      expect(() => guardFor().canActivate(contextFor({ header: token }))).toThrow(
        ForbiddenException,
      );
    });

    it('refuse un cookie et un en-tete qui divergent', () => {
      expect(() =>
        guardFor().canActivate(
          contextFor({
            cookie: csrfTokens.issue(ALICE),
            header: csrfTokens.issue(ALICE),
          }),
        ),
      ).toThrow(ForbiddenException);
    });

    // Le cas que le double-submit NAIF laisse passer : un sous-domaine hostile
    // ecrit les deux moities, elles concordent, et rien ne les rattache a la
    // session. Ici la signature les y rattache.
    it('refuse deux moities concordantes emises pour un AUTRE utilisateur', () => {
      const bobToken = csrfTokens.issue(BOB);

      expect(() =>
        guardFor().canActivate(
          contextFor({ cookie: bobToken, header: bobToken, userId: ALICE }),
        ),
      ).toThrow(ForbiddenException);
    });

    it('refuse un jeton fabrique de toutes pieces', () => {
      const forged = 'nonce-choisi-par-attaquant.signature-inventee';

      expect(() =>
        guardFor().canActivate(contextFor({ cookie: forged, header: forged })),
      ).toThrow(ForbiddenException);
    });

    it('refuse quand la requete n a pas d identite', () => {
      const token = csrfTokens.issue(ALICE);

      // Ne doit jamais arriver — le JwtAuthGuard passe avant — mais un jeton ne
      // doit pas devenir valide parce que request.user manque.
      expect(() =>
        guardFor().canActivate(
          contextFor({ cookie: token, header: token, userId: '' }),
        ),
      ).toThrow(ForbiddenException);
    });
  });

  describe('toutes les methodes mutantes sont couvertes', () => {
    it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('exige un jeton sur %s', (method) => {
      expect(() => guardFor().canActivate(contextFor({ method }))).toThrow(
        ForbiddenException,
      );
    });
  });
});
