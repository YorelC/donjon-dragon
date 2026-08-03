export const API_ROUTES = {
  auth: {
    register: "/api/auth/register",
    login: "/api/auth/login",
    verifyEmail: "/api/auth/verify-email",
    logout: "/api/auth/logout",
    refresh: "/api/auth/refresh",
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
