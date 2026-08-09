import { CSRF_COOKIE } from "@donjon-dragon/shared";

/**
 * Relit le jeton CSRF déposé par le serveur.
 *
 * C'est le seul cookie de session que le front lit — les deux autres sont
 * `httpOnly`. Le lire n'est pas une faiblesse mais le mécanisme lui-même : le
 * recopier en en-tête prouve au serveur qu'un script de SON origine a pu y
 * accéder, ce qu'un formulaire hébergé ailleurs ne peut pas faire. Le jeton porte
 * en plus une signature qui le lie à la session, donc en fabriquer un ne sert à
 * rien.
 */
export function readCsrfToken(): string | null {
  const value = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${CSRF_COOKIE}=([^;]*)`),
  )?.[1];

  return value === undefined ? null : decodeURIComponent(value);
}
