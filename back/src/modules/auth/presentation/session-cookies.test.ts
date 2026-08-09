import { describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { CSRF_COOKIE } from '@donjon-dragon/shared/csrf-transport';

import { CsrfTokenService } from '@common/security/csrf-token.service';
import { REFRESH_TTL_MS } from '../domain/token/refresh-token';
import { ACCESS_COOKIE, REFRESH_COOKIE, SessionCookies } from './session-cookies';

const ALICE = '11111111-1111-4111-8111-111111111111';

const csrfTokens = new CsrfTokenService({
  getOrThrow: () => 'un-secret-de-test-suffisamment-long-pour-hmac',
} as unknown as ConfigService);

function cookiesFor(isProduction: boolean): SessionCookies {
  return new SessionCookies(
    { getOrThrow: () => isProduction } as unknown as ConfigService,
    csrfTokens,
  );
}

interface WrittenCookie {
  name: string;
  value: string;
  options: CookieOptions;
}

function issueInto(isProduction = false): WrittenCookie[] {
  const written: WrittenCookie[] = [];
  const response = {
    cookie: (name: string, value: string, options: CookieOptions) => {
      written.push({ name, value, options });
    },
  } as unknown as Response;

  cookiesFor(isProduction).issue(response, ALICE, 'le-refresh-token', 'l-access-token');

  return written;
}

function find(written: WrittenCookie[], name: string): WrittenCookie {
  const cookie = written.find((entry) => entry.name === name);
  if (!cookie) throw new Error(`cookie ${name} absent`);

  return cookie;
}

describe('SessionCookies', () => {
  it('pose exactement trois cookies', () => {
    const written = issueInto();

    expect(written.map((entry) => entry.name)).toEqual([
      ACCESS_COOKIE,
      REFRESH_COOKIE,
      CSRF_COOKIE,
    ]);
  });

  // La decision qui fonde tout ce lot : les deux secrets sont illisibles par le
  // JavaScript de la page, donc une faille XSS ne les exfiltre plus.
  describe('httpOnly sur les secrets, et seulement sur eux', () => {
    it.each([ACCESS_COOKIE, REFRESH_COOKIE])('%s est httpOnly', (name) => {
      expect(find(issueInto(), name).options.httpOnly).toBe(true);
    });

    it('csrf_token ne l est PAS, volontairement', () => {
      // Le front doit le relire pour le recopier en en-tete : c'est le mecanisme
      // lui-meme. Sa signature le protege, pas son secret.
      expect(find(issueInto(), CSRF_COOKIE).options.httpOnly).toBe(false);
    });
  });

  describe('SameSite', () => {
    it.each([ACCESS_COOKIE, REFRESH_COOKIE, CSRF_COOKIE])('%s est en Lax', (name) => {
      // Lax bloque le CSRF inter-site classique sans casser la navigation entrante,
      // contrairement a Strict qui deconnecterait visuellement a chaque arrivee
      // depuis un lien externe.
      expect(find(issueInto(), name).options.sameSite).toBe('lax');
    });
  });

  describe('secure suit l environnement', () => {
    it('est actif en production', () => {
      const written = issueInto(true);

      expect(written.every((entry) => entry.options.secure)).toBe(true);
    });

    it('est inactif hors production, sinon le dev en http ne recevrait rien', () => {
      const written = issueInto(false);

      expect(written.every((entry) => entry.options.secure === false)).toBe(true);
    });
  });

  describe('portee', () => {
    it('limite le refresh token aux routes qui le consomment', () => {
      // Il ne part donc pas sur les appels metier : une requete vers /api/friends
      // n'a aucune raison de transporter le secret de renouvellement.
      expect(find(issueInto(), REFRESH_COOKIE).options.path).toBe('/api/auth');
    });

    it.each([ACCESS_COOKIE, CSRF_COOKIE])('%s couvre tout le site', (name) => {
      expect(find(issueInto(), name).options.path).toBe('/');
    });

    it("l'access token n'a pas de maxAge : il meurt avec l'onglet", () => {
      expect(find(issueInto(), ACCESS_COOKIE).options.maxAge).toBeUndefined();
    });

    it('le refresh token vit aussi longtemps que sa contrepartie en base', () => {
      expect(find(issueInto(), REFRESH_COOKIE).options.maxAge).toBe(REFRESH_TTL_MS);
    });
  });

  describe('jeton CSRF', () => {
    it('est valide pour la session qui vient de s ouvrir', () => {
      const written = issueInto();

      expect(csrfTokens.matches(find(written, CSRF_COOKIE).value, ALICE)).toBe(true);
    });

    // Rotation a chaque ouverture de session : sans elle, un jeton obtenu avant
    // l'authentification resterait valide apres, ce qui est la session fixation.
    it('tourne a chaque emission', () => {
      const first = find(issueInto(), CSRF_COOKIE).value;
      const second = find(issueInto(), CSRF_COOKIE).value;

      expect(first).not.toBe(second);
    });
  });

  describe('clear', () => {
    it('efface les trois cookies avec la meme portee que celle posee', () => {
      const cleared = vi.fn();
      const response = { clearCookie: cleared } as unknown as Response;

      cookiesFor(false).clear(response);

      // Un path qui ne correspond pas laisse le cookie en place : la deconnexion
      // serait alors silencieusement incomplete.
      expect(cleared).toHaveBeenCalledTimes(3);
      expect(cleared).toHaveBeenCalledWith(ACCESS_COOKIE, expect.objectContaining({ path: '/' }));
      expect(cleared).toHaveBeenCalledWith(
        REFRESH_COOKIE,
        expect.objectContaining({ path: '/api/auth' }),
      );
      expect(cleared).toHaveBeenCalledWith(
        CSRF_COOKIE,
        expect.objectContaining({ path: '/', httpOnly: false }),
      );
    });
  });

  describe('presentedRefreshToken', () => {
    it('lit le cookie de renouvellement', () => {
      const request = {
        cookies: { [REFRESH_COOKIE]: 'le-refresh-token' },
      } as unknown as Request;

      expect(SessionCookies.presentedRefreshToken(request)).toBe('le-refresh-token');
    });

    it.each([
      ['cookies absents', {}],
      ['cookie absent', { cookies: {} }],
    ])('rend une chaine vide quand %s', (_name, request) => {
      // Chaine vide et non undefined : le use-case la refusera comme un token
      // inconnu, sans que le controller ait a tester le cas.
      expect(SessionCookies.presentedRefreshToken(request as Request)).toBe('');
    });
  });
});
