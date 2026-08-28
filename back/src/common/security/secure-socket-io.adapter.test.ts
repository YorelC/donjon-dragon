import { describe, expect, it } from 'vitest';

import { isAllowedSocketOrigin } from './secure-socket-io.adapter';

/**
 * Le handshake WebSocket n'est pas soumis a la same-origin policy : n'importe quel
 * site peut le tenter. Le navigateur fournit `Origin` pour que le serveur tranche,
 * et `allowRequest` est le seul endroit ou cette decision se prend — l'option CORS
 * de Socket.IO ne couvre que le repli long-polling.
 */
const ALLOWED = new Set(['http://localhost:5173', 'https://donjon-dragon.app']);

describe('isAllowedSocketOrigin', () => {
  it('accepte une origine de la liste', () => {
    expect(isAllowedSocketOrigin('http://localhost:5173', ALLOWED)).toBe(true);
  });

  it('refuse une origine absente de la liste', () => {
    expect(isAllowedSocketOrigin('https://evil.example', ALLOWED)).toBe(false);
  });

  // Le produit est une SPA navigateur : une connexion sans `Origin` ne vient pas
  // d'un navigateur, donc pas d'un client legitime.
  it('refuse un handshake sans origine', () => {
    expect(isAllowedSocketOrigin(undefined, ALLOWED)).toBe(false);
  });

  // Une origine n'est pas un prefixe : le port et le schema en font partie.
  it('refuse une origine qui ne diffère que par le port ou le schéma', () => {
    expect(isAllowedSocketOrigin('http://localhost:5174', ALLOWED)).toBe(false);
    expect(isAllowedSocketOrigin('https://localhost:5173', ALLOWED)).toBe(false);
  });

  it('refuse tout quand la liste est vide', () => {
    expect(isAllowedSocketOrigin('http://localhost:5173', new Set())).toBe(false);
  });
});
