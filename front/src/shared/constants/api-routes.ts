export const API_ROUTES = {
  auth: {
    register: "/api/auth/register",
    login: "/api/auth/login",
    verifyEmail: "/api/auth/verify-email",
    logout: "/api/auth/logout",
    refresh: "/api/auth/refresh",
    me: "/api/auth/me",
  },
  friends: {
      list: "/api/friends",
      incoming: "/api/friends/requests/incoming",
      incomingCount: "/api/friends/requests/incoming/count",
      outgoing: "/api/friends/requests/outgoing",
      search: (q: string) => `/api/friends/search?q=${encodeURIComponent(q)}`,
      sendRequest: (displayName: string) => `/api/friends/request/${encodeURIComponent(displayName)}`,
      accept: (friendshipId: string) => `/api/friends/accept/${friendshipId}`,
      refuse: (friendshipId: string) => `/api/friends/refuse/${friendshipId}`,
      remove: (friendshipId: string) => `/api/friends/${friendshipId}`,
    },
} as const;

/**
 * Routes dont un 401 est une RÉPONSE, pas un accident de session.
 *
 * L'intercepteur de `api.ts` réessaye après un refresh dès qu'il voit un 401 —
 * comportement juste pour une route protégée dont l'access token vient d'expirer,
 * absurde ici : un mot de passe erroné n'est pas un token périmé. Sans cette
 * exclusion, un simple échec de connexion consommait et faisait tourner le refresh
 * token de la session précédente, puis rejouait le login. Même chose pour
 * `verify-email`, dont le token est à usage unique : le rejeu le brûlait.
 *
 * `me` n'y figure PAS, volontairement : c'est justement la route où un 401 doit
 * déclencher un refresh, puisque c'est ainsi qu'une session est reprise au
 * chargement de la page.
 */
export const UNAUTHENTICATED_ROUTES: readonly string[] = [
  API_ROUTES.auth.register,
  API_ROUTES.auth.login,
  API_ROUTES.auth.verifyEmail,
  API_ROUTES.auth.refresh,
];
