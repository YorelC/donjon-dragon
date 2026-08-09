/** Nom du cookie de renouvellement, retiré des états partagés (voir plus bas). */
export const REFRESH_COOKIE = 'refresh_token';

/**
 * Sessions enregistrées par `auth.setup.ts`, réutilisées par tous les specs.
 *
 * POURQUOI un état partagé : se connecter par l'interface dans chaque test épuisait
 * le throttle du back (10 requêtes/minute sur `login`, une limite qu'on veut garder
 * serrée). Les connexions passent ainsi de ~35 à quelques-unes.
 *
 * Ça marche malgré les cookies `httpOnly` : `storageState()` est un export au niveau
 * du NAVIGATEUR, pas du JavaScript de la page. Il voit donc ce que `document.cookie`
 * ne voit pas — sans rien contredire du modèle de menace, une faille XSS n'ayant pas
 * accès au protocole de contrôle de Chrome.
 *
 * POURQUOI SANS LE REFRESH TOKEN : un état partagé par N contextes leur donnerait à
 * tous le MÊME refresh token. Or ce token tourne à chaque usage et sa réutilisation
 * est traitée comme une fuite. Passé les 15 minutes de vie de l'access token, un
 * premier contexte renouvellerait, et tous les suivants présenteraient un token déjà
 * consommé — la détection révoquerait la lignée et ferait tomber la fin de la suite,
 * pour une raison n'ayant rien à voir avec le code testé.
 *
 * Le retirer rend cette situation IMPOSSIBLE, et pas seulement improbable : aucun
 * contexte ne peut plus déclencher de rotation. Si l'access token expire malgré tout,
 * l'échec est net et local (401 puis redirection), pas une cascade.
 *
 * Contrepartie assumée : les tests qui observent ce que la CONNEXION établit — les
 * drapeaux des trois cookies, leur invisibilité au JavaScript, la déconnexion — font
 * une vraie connexion. C'est d'ailleurs plus juste : ils portent sur ce que
 * `POST /login` pose, pas sur un état rejoué.
 */
export const STORAGE_STATE = {
  gandalf: 'e2e/.auth/gandalf.json',
  legolas: 'e2e/.auth/legolas.json',
} as const;

/** Pour les specs qui testent la connexion elle-même : aucun cookie au départ. */
export const NO_SESSION = { cookies: [], origins: [] };
