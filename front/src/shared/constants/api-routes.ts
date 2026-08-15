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
      search: (q: string, page: number) =>
        `/api/friends/search?q=${encodeURIComponent(q)}&page=${page}`,
      sendRequest: (displayName: string) => `/api/friends/request/${encodeURIComponent(displayName)}`,
      accept: (friendshipId: string) => `/api/friends/accept/${friendshipId}`,
      refuse: (friendshipId: string) => `/api/friends/refuse/${friendshipId}`,
      remove: (friendshipId: string) => `/api/friends/${friendshipId}`,
    },
  campaigns: {
    list: "/api/campaigns",
    create: "/api/campaigns",
    invitations: "/api/campaigns/invitations",
    invitationsCount: "/api/campaigns/invitations/count",
    invite: (campaignId: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}/invitations`,
    acceptInvitation: (campaignId: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}/invitations/accept`,
    refuseInvitation: (campaignId: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}/invitations/refuse`,
    detail: (campaignId: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}`,
    remove: (campaignId: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}`,
    // Quitter est un POST et non un DELETE .../members/me : « me » est un pseudo
    // valide, la route paramétrée des membres l'avalerait.
    leave: (campaignId: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}/leave`,
    owner: (campaignId: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}/owner`,
    removeMember: (campaignId: string, displayName: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}/members/${encodeURIComponent(displayName)}`,
    promoteMember: (campaignId: string, displayName: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}/members/${encodeURIComponent(displayName)}/promote`,
    demoteMember: (campaignId: string, displayName: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}/members/${encodeURIComponent(displayName)}/demote`,
    selfPromote: (campaignId: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}/owner/promote`,
    selfDemote: (campaignId: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}/owner/demote`,
  },
  dnd: {
    catalog: () => `/api/dnd/catalog`,
    spells: (classKey: string) => `/api/dnd/spells/${encodeURIComponent(classKey)}`,
  },
  characters: {
    list: (campaignId: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}/characters`,
    create: (campaignId: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}/characters`,
    finalize: (campaignId: string, characterId: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}/characters/${encodeURIComponent(characterId)}`,
    sheet: (campaignId: string, characterId: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}/characters/${encodeURIComponent(characterId)}/sheet`,
    build: (campaignId: string, characterId: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}/characters/${encodeURIComponent(characterId)}/build`,
    sheetPreview: (campaignId: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}/characters/sheet-preview`,
    remove: (campaignId: string, characterId: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}/characters/${encodeURIComponent(characterId)}`,
    assign: (campaignId: string, characterId: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}/characters/${encodeURIComponent(characterId)}/assign`,
    unassign: (campaignId: string, characterId: string) =>
      `/api/campaigns/${encodeURIComponent(campaignId)}/characters/${encodeURIComponent(characterId)}/unassign`,
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
