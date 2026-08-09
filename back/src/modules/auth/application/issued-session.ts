import type { PublicUser } from '@donjon-dragon/shared/user-schema';

/**
 * Ce qu'un use-case d'authentification produit : un profil et deux secrets.
 *
 * Type INTERNE, volontairement absent du contrat partagé. Les secrets ne
 * traversent pas le réseau dans le corps de la réponse — c'est la couche
 * présentation qui les pose en cookies `httpOnly` et ne renvoie que `user`.
 * Le front n'a donc rien à stocker, ni rien à oublier de nettoyer.
 */
export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}
