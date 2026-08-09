import { useEffect } from "react";
import { PublicUserSchema } from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { SESSION_STATUS, useAuthStore } from "@/shared/stores/auth.store";

/**
 * Verrou single-flight, pour la même raison que dans `refresh.ts` : en mode strict
 * React monte l'effet deux fois, et deux bootstraps concurrents feraient deux
 * appels dont l'un peut déclencher un renouvellement inutile.
 */
let inFlight: Promise<void> | null = null;

/**
 * Rétablit la session au chargement de l'application.
 *
 * Les tokens étant `httpOnly`, le front est structurellement incapable de savoir
 * s'il est connecté : il ne peut que demander. `GET /api/auth/me` est cette
 * question — et un 401 y déclenche d'abord un renouvellement (cf. `api.ts`), donc
 * un access token expiré après une nuit ne déconnecte pas pour autant.
 *
 * À appeler une seule fois, à la racine : le résultat est un état global.
 */
export function useSessionBootstrap(): void {
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status !== SESSION_STATUS.unknown || inFlight) return;

    inFlight = loadSession().finally(() => {
      inFlight = null;
    });
  }, [status]);
}

async function loadSession(): Promise<void> {
  try {
    const user = PublicUserSchema.parse(await api.get(API_ROUTES.auth.me));
    useAuthStore.getState().setAuth({ user });
  } catch {
    // On ne referme que ce qu'on a ouvert : si une connexion a abouti pendant que
    // /me était en vol, son résultat fait autorité et ne doit pas être écrasé.
    if (useAuthStore.getState().status === SESSION_STATUS.unknown) {
      useAuthStore.getState().clearAuth();
    }
  }
}
