import type { APIRequestContext, Page } from '@playwright/test';

/**
 * Appels API pour PREPARER et NETTOYER l'état — jamais pour assertionner.
 *
 * Ces tests tournent sur une vraie base, avec des comptes partagés : une demande
 * d'ami créée par un test survit au test, et le second passage échoue en 409. Un
 * test qui n'est pas rejouable est un test qu'on finit par ignorer.
 *
 * On amène donc la base à un état connu AVANT chaque scénario, par l'API — c'est
 * rapide et ce n'est pas ce qu'on cherche à vérifier. Les assertions, elles, restent
 * dans l'interface.
 *
 * Les fonctions prennent un `APIRequestContext` : ça couvre `page.request` (la
 * session de l'onglet courant) comme un contexte API autonome ouvert sur un AUTRE
 * compte, ce qui permet de poser une précondition « quelqu'un d'autre t'a envoyé une
 * demande » sans ouvrir une seconde fenêtre.
 */
async function csrfHeader(api: APIRequestContext): Promise<Record<string, string>> {
  const { cookies } = await api.storageState();
  const token = cookies.find((cookie) => cookie.name === 'csrf_token')?.value;
  if (!token) throw new Error('Aucun cookie csrf_token : la session est-elle ouverte ?');

  // Recopier le jeton exactement comme le vrai client : au passage, ça vérifie que
  // le mécanisme tient aussi hors du code applicatif.
  return { 'x-csrf-token': token };
}

interface FriendshipRecord {
  id: string;
}

interface FriendRecord {
  friendshipId: string;
}

/**
 * Remet le compte à zéro relationnel : amitiés, demandes envoyées, demandes reçues.
 *
 * `DELETE /api/friends/:id` ne vérifie que l'appartenance, pas le statut : il accepte
 * donc aussi bien une amitié acceptée qu'une demande en attente ou refusée. C'est ce
 * qui rend ce nettoyage possible en un appel par relation.
 */
export async function clearAllRelations(api: APIRequestContext): Promise<void> {
  const headers = await csrfHeader(api);

  const friends: FriendRecord[] = await getJson(api, '/api/friends');
  for (const friend of friends) {
    await api.delete(`/api/friends/${friend.friendshipId}`, { headers });
  }

  for (const route of [
    '/api/friends/requests/outgoing',
    '/api/friends/requests/incoming',
  ]) {
    const requests: FriendshipRecord[] = await getJson(api, route);
    for (const request of requests) {
      await api.delete(`/api/friends/${request.id}`, { headers });
    }
  }
}

/** Crée une demande d'ami depuis la session de `api` vers `displayName`. */
export async function sendFriendRequest(
  api: APIRequestContext,
  displayName: string,
): Promise<void> {
  const response = await api.post(
    `/api/friends/request/${encodeURIComponent(displayName)}`,
    { headers: await csrfHeader(api) },
  );

  if (!response.ok()) {
    throw new Error(
      `Préparation échouée : demande vers ${displayName} -> ${response.status()} ${await response.text()}`,
    );
  }
}

async function getJson<T>(api: APIRequestContext, path: string): Promise<T> {
  const response = await api.get(path);
  if (!response.ok()) {
    // Un 401 ici a une cause probable et une seule : l'access token de la session
    // partagée a expiré parce que la suite a dépassé sa durée de vie. Le dire, plutôt
    // que de laisser chercher dans un « expected heading to be visible ».
    const hint =
      response.status() === 401
        ? " — la session partagee a expire (access token > 15 min). Relance la suite : auth.setup.ts en ouvrira une neuve."
        : '';

    throw new Error(`GET ${path} -> ${response.status()}${hint}`);
  }

  return response.json() as Promise<T>;
}

/** Ce que le JavaScript de la page peut lire des cookies. Le coeur du Lot D. */
export async function cookiesVisibleToPageScripts(page: Page): Promise<string> {
  return page.evaluate(() => document.cookie);
}

export async function localStorageEntries(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => ({ ...localStorage }));
}
