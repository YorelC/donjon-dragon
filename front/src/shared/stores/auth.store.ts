import { create } from "zustand";
import type { AuthSession, PublicUser } from "@donjon-dragon/shared";

/**
 * État de la session côté client.
 *
 * `unknown` est l'état INITIAL, et il est indispensable : les tokens vivent dans
 * des cookies `httpOnly` que le JavaScript ne peut pas lire, donc au premier
 * rendu le front ne sait pas s'il a une session. Sans ce troisième état, une
 * page protégée rechargée redirigerait vers /login avant même d'avoir demandé —
 * l'utilisateur serait déconnecté par un détail de rendu.
 *
 * `GET /api/auth/me` est ce qui tranche entre `authenticated` et `anonymous`.
 */
const SESSION_STATUSES = ["unknown", "authenticated", "anonymous"] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

/** Objet — pour désigner un statut sans l'écrire en dur. */
export const SESSION_STATUS = Object.fromEntries(
  SESSION_STATUSES.map((status) => [status, status]),
) as { readonly [S in SessionStatus]: S };

/** Tuple — pour énumérer. */
export const SESSION_STATUS_VALUES: readonly SessionStatus[] = SESSION_STATUSES;

interface AuthState {
  user: PublicUser | null;
  status: SessionStatus;
  /** Session ouverte : login, vérification d'email, refresh, ou bootstrap /me. */
  setAuth: (session: AuthSession) => void;
  /** Session fermée, ou confirmée absente par /me. */
  clearAuth: () => void;
}

/**
 * Aucun `persist`, et c'est le point : il n'y a plus rien à persister.
 *
 * Les deux secrets sont des cookies `httpOnly` — le navigateur les rattache seul à
 * chaque requête, et aucun script de la page ne peut les lire. Écrire quoi que ce
 * soit dans `localStorage` reviendrait à rendre à une faille XSS ce qu'on vient de
 * lui retirer. `user` n'est qu'un cache d'affichage, reconstruit par /me à chaque
 * chargement.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: SESSION_STATUS.unknown,
  setAuth: (session: AuthSession) =>
    set({ user: session.user, status: SESSION_STATUS.authenticated }),
  clearAuth: () => set({ user: null, status: SESSION_STATUS.anonymous }),
}));
