import { describe, expect, it } from 'vitest';
import type { ConfigService } from '@nestjs/config';

import { CsrfTokenService } from './csrf-token.service';

const SECRET = 'un-secret-de-test-suffisamment-long-pour-hmac';
const ALICE = '11111111-1111-4111-8111-111111111111';
const BOB = '22222222-2222-4222-8222-222222222222';

/** Un jeton bien forme a toujours ses deux moities — d'ou l'assertion. */
function split(token: string): { nonce: string; signature: string } {
  const [nonce, signature] = token.split('.');
  if (!nonce || !signature) throw new Error(`jeton malforme: ${token}`);

  return { nonce, signature };
}

function serviceWith(secret: string = SECRET): CsrfTokenService {
  return new CsrfTokenService({
    getOrThrow: () => secret,
  } as unknown as ConfigService);
}

describe('CsrfTokenService', () => {
  it('accepte le jeton qu il vient d emettre', () => {
    const service = serviceWith();

    expect(service.matches(service.issue(ALICE), ALICE)).toBe(true);
  });

  it('emet un jeton different a chaque appel', () => {
    const service = serviceWith();

    // La rotation a chaque ouverture de session est la defense contre la session
    // fixation : elle ne vaut que si le nouveau jeton est reellement nouveau.
    expect(service.issue(ALICE)).not.toBe(service.issue(ALICE));
  });

  it('les deux jetons successifs restent valides pour leur porteur', () => {
    const service = serviceWith();

    const first = service.issue(ALICE);
    const second = service.issue(ALICE);

    expect(service.matches(first, ALICE)).toBe(true);
    expect(service.matches(second, ALICE)).toBe(true);
  });

  // Le coeur du double-submit SIGNE : c'est cette liaison a la session qui manque
  // au double-submit naif, et qui le rend cassable par un sous-domaine hostile.
  describe('liaison a la session', () => {
    it('refuse le jeton valide d un AUTRE utilisateur', () => {
      const service = serviceWith();

      expect(service.matches(service.issue(ALICE), BOB)).toBe(false);
    });

    it('refuse un jeton sans identite associee', () => {
      const service = serviceWith();

      // Le garde passe une chaine vide quand request.user est absent : ce cas ne
      // doit jamais valider quoi que ce soit.
      expect(service.matches(service.issue(ALICE), '')).toBe(false);
    });
  });

  describe('integrite', () => {
    it('refuse une signature alteree', () => {
      const service = serviceWith();
      const { nonce, signature } = split(service.issue(ALICE));

      expect(service.matches(`${nonce}.${signature.slice(0, -1)}X`, ALICE)).toBe(false);
    });

    it('refuse un nonce altere', () => {
      const service = serviceWith();
      const { nonce, signature } = split(service.issue(ALICE));

      expect(service.matches(`${nonce.slice(0, -1)}X.${signature}`, ALICE)).toBe(false);
    });

    it('refuse un jeton signe avec une autre cle', () => {
      const forged = serviceWith('un-autre-secret-tout-aussi-long-mais-different').issue(
        ALICE,
      );

      expect(serviceWith().matches(forged, ALICE)).toBe(false);
    });
  });

  describe('entrees degenerees', () => {
    it.each([
      ['undefined', undefined],
      ['chaine vide', ''],
      ['sans separateur', 'nonce-seul'],
      ['nonce vide', '.signature'],
      ['signature vide', 'nonce.'],
      ['separateur seul', '.'],
    ])('refuse %s sans lever', (_name, token) => {
      const service = serviceWith();

      expect(service.matches(token, ALICE)).toBe(false);
    });
  });
});
