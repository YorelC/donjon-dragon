import { CSRF_HEADER } from "@donjon-dragon/shared";
import { UNAUTHENTICATED_ROUTES } from "@/shared/constants/api-routes";
import { ApiError, toApiError } from "./api-error";
import { readCsrfToken } from "./csrf";
import { refreshSession } from "./refresh";

export { ApiError } from "./api-error";

// Ces méthodes ne changent pas d'état : le serveur n'exige pas de jeton CSRF, donc
// on n'en envoie pas.
const SAFE_METHODS: readonly string[] = ["GET", "HEAD", "OPTIONS"];

function buildHeaders(options?: RequestInit): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options?.headers) {
    const optionHeaders =
      options.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : (options.headers as Record<string, string>);
    Object.assign(headers, optionHeaders);
  }

  // Plus d'en-tête Authorization : l'access token est un cookie httpOnly que le
  // navigateur rattache seul. Rien à lire dans la page, donc rien à exfiltrer.
  const csrfToken = requiresCsrf(options?.method) ? readCsrfToken() : null;
  if (csrfToken) {
    headers[CSRF_HEADER] = csrfToken;
  }

  return headers;
}

function requiresCsrf(method?: string): boolean {
  return !SAFE_METHODS.includes(method ?? "GET");
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw await toApiError(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

async function request<T>(
  path: string,
  options?: RequestInit,
  retry: boolean = false,
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: buildHeaders(options),
    // Sans ceci aucun cookie ne part, et toute la session en dépend.
    credentials: "include",
  });

  if (res.ok || res.status !== 401 || retry || isUnauthenticatedRoute(path)) {
    return handleResponse<T>(res);
  }

  return attemptRefreshAndRetry<T>(path, options);
}

/**
 * Un 401 sur une route protégée signifie « access token expiré » : on renouvelle la
 * session et on rejoue une seule fois. Sur une route d'authentification il signifie
 * « identifiants refusés » — d'où l'exclusion dans `request`.
 *
 * Le rejeu repasse par `request`, ce qui relit le jeton CSRF : le refresh vient de
 * le faire tourner, donc réutiliser les en-têtes du premier essai partirait en 403.
 */
async function attemptRefreshAndRetry<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  try {
    await refreshSession();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "Session expirée");
  }

  // Hors du try : une erreur du rejeu est une vraie erreur d'appel, elle doit
  // remonter telle quelle et non se déguiser en échec de renouvellement.
  return request<T>(path, options, true);
}

function isUnauthenticatedRoute(path: string): boolean {
  return UNAUTHENTICATED_ROUTES.includes(path);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
