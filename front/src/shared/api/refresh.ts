import { AuthSessionSchema } from "@donjon-dragon/shared";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { useAuthStore } from "@/shared/stores/auth.store";
import { ApiError, toApiError } from "./api-error";

const HTTP_UNAUTHORIZED = 401;
const HTTP_CONFLICT = 409;

/**
 * Verrou single-flight : dix requêtes qui expirent en même temps ne doivent
 * déclencher qu'un seul renouvellement. Le refresh token tourne à chaque usage,
 * donc deux appels concurrents feraient présenter au second un token déjà consommé.
 */
let inFlight: Promise<void> | null = null;

export async function refreshSession(): Promise<void> {
  if (inFlight) {
    return inFlight;
  }

  inFlight = performRefresh().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

/**
 * Ne renvoie plus de token : il n'y a plus rien à renvoyer. Le serveur repose ses
 * cookies, et la seule chose qui remonte ici est le profil — donc l'information
 * « la session est vivante ».
 */
async function performRefresh(): Promise<void> {
  // 409 = course entre onglets : un autre onglet a fait tourner le token une
  // fraction de seconde avant nous. Sa réponse a déjà posé le nouveau cookie, donc
  // un seul rejeu suffit. Ce n'est pas une fuite, et surtout pas une raison de
  // déconnecter — le back distingue les deux par sa fenêtre de grâce.
  const first = await postRefresh();
  const res = first.status === HTTP_CONFLICT ? await postRefresh() : first;

  if (!res.ok) {
    // Vider la session UNIQUEMENT sur 401. C'était le bug : un `!res.ok` déconnectait
    // aussi sur un 429 du throttler ou un 5xx, c'est-à-dire qu'atteindre une limite de
    // débit coûtait la session alors que le refresh token était parfaitement valide.
    if (res.status === HTTP_UNAUTHORIZED) {
      useAuthStore.getState().clearAuth();
    }
    throw await toApiError(res);
  }

  const parsed = AuthSessionSchema.safeParse(await res.json());
  if (!parsed.success) {
    throw new ApiError(res.status, "Réponse de session invalide");
  }

  useAuthStore.getState().setAuth(parsed.data);
}

// Aucun corps, aucune lecture de token : le refresh token est un cookie httpOnly
// que le navigateur joint seul, et que le JavaScript ne peut pas lire.
async function postRefresh(): Promise<Response> {
  return fetch(API_ROUTES.auth.refresh, {
    method: "POST",
    credentials: "include",
  });
}
