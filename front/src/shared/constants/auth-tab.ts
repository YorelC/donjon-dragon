/**
 * Les deux onglets du panneau d'accès de l'accueil. La valeur voyage dans l'URL
 * (`/?onglet=connexion`) : elle est donc en français, comme le reste des routes
 * visibles par l'utilisateur.
 */
export const AUTH_TAB = {
  signup: "inscription",
  login: "connexion",
} as const;

export type AuthTab = (typeof AUTH_TAB)[keyof typeof AUTH_TAB];

export const AUTH_TAB_PARAM = "onglet";

export const isAuthTab = (value: string | null): value is AuthTab =>
  value === AUTH_TAB.signup || value === AUTH_TAB.login;
