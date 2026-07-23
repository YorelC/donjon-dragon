import { create } from "zustand";
import type { PublicUser, AuthTokens } from "@donjon-dragon/shared";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: PublicUser | null;
  setAuth: (tokens: AuthTokens) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  setAuth: (tokens: AuthTokens) =>
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.user,
    }),
  clearAuth: () =>
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
    }),
}));
