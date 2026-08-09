/**
 * Sessions enregistrées par `auth.setup.ts`, réutilisées par tous les specs.
 *
 * Pourquoi : se connecter par l'interface dans chaque test épuisait le throttle du
 * back (10 requêtes/minute sur `login`, et c'est une limite qu'on veut garder
 * serrée). Les logins passent ainsi de ~35 à 2.
 *
 * Ça marche malgré les cookies `httpOnly` : `storageState()` est un export au
 * niveau du NAVIGATEUR, pas du JavaScript de la page. Il voit donc ce que
 * `document.cookie` ne voit pas — ce qui ne contredit en rien le modèle de menace,
 * une faille XSS n'ayant pas accès au protocole de contrôle de Chrome.
 *
 * Limite à connaître : l'access token vit 15 minutes. Si la suite dépasse cette
 * durée, les contextes partageant un même refresh token se mettent à le faire
 * tourner en concurrence — et la détection de réutilisation révoque la lignée. La
 * suite doit donc rester rapide ; si elle grossit, il faudra rejouer le setup par
 * fichier de test.
 */
export const STORAGE_STATE = {
  gandalf: 'e2e/.auth/gandalf.json',
  legolas: 'e2e/.auth/legolas.json',
} as const;

/** Pour les specs qui testent la connexion elle-même : aucun cookie au départ. */
export const NO_SESSION = { cookies: [], origins: [] };
