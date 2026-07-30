export const API_ROUTES = {
  auth: {
    register: "/api/auth/register",
    login: "/api/auth/login",
    verifyEmail: "/api/auth/verify-email",
    logout: "/api/auth/logout",
    refresh: "/api/auth/refresh",
  },
  characters: {
    byUser: (userId: string) => `/api/characters?userId=${userId}`,
    byId: (id: string) => `/api/characters/${id}`,
    create: "/api/characters",
  },
  friends: {
    list: "/api/friends",
    incoming: "/api/friends/requests/incoming",
    outgoing: "/api/friends/requests/outgoing",
    search: (q: string) => `/api/friends/search?q=${encodeURIComponent(q)}`,
    sendRequest: (displayName: string) => `/api/friends/request/${encodeURIComponent(displayName)}`,
    accept: (friendshipId: string) => `/api/friends/accept/${friendshipId}`,
    refuse: (friendshipId: string) => `/api/friends/refuse/${friendshipId}`,
    remove: (friendshipId: string) => `/api/friends/${friendshipId}`,
  },
} as const;

export const WS_NAMESPACES = {
  combat: "combat",
} as const;
