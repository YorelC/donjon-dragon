import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  REALTIME_EVENT,
  REALTIME_RESOURCE,
  RealtimeResourceChangedSchema,
  type RealtimeResource,
} from "@donjon-dragon/shared";
import { refreshSession } from "@/shared/api/refresh";
import {
  SESSION_STATUS,
  useAuthStore,
} from "@/shared/stores/auth.store";
import { realtimeClient } from "./realtime-client";
import { RealtimeMessageCache } from "./realtime-message-cache";

const seenMessages = new RealtimeMessageCache();

export function useRealtimeInvalidation(): void {
  const status = useAuthStore((state) => state.status);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status !== SESSION_STATUS.authenticated) return;
    const listeners = realtimeListeners(queryClient);
    subscribe(listeners);
    // Une session neuve a droit a sa tentative de recuperation, meme si la
    // precedente s'est arretee sur un renouvellement impossible.
    resetRealtimeRecovery();
    realtimeClient.connect();
    return () => unsubscribe(listeners);
  }, [queryClient, status]);
}

/**
 * `session.expired` et `connect_error` disent la même chose de deux façons : le
 * serveur a refusé cette session. La sortie est la même — renouveler puis
 * reconnecter.
 */
function realtimeListeners(queryClient: QueryClient) {
  return {
    [REALTIME_EVENT.resourceChanged]:
      createRealtimeInvalidationListener(queryClient),
    [REALTIME_EVENT.sessionExpired]: () => void recoverSession(),
    connect_error: () => void recoverSession(),
    connect: () => {
      recovering = false;
    },
  };
}

type RealtimeListeners = ReturnType<typeof realtimeListeners>;

function subscribe(listeners: RealtimeListeners): void {
  Object.entries(listeners).forEach(([event, listener]) =>
    realtimeClient.on(event, listener),
  );
}

function unsubscribe(listeners: RealtimeListeners): void {
  Object.entries(listeners).forEach(([event, listener]) =>
    realtimeClient.off(event, listener),
  );
  realtimeClient.disconnect();
}

export function createRealtimeInvalidationListener(
  queryClient: QueryClient,
  cache: RealtimeMessageCache = seenMessages,
) {
  return (input: unknown): void => {
    const parsed = RealtimeResourceChangedSchema.safeParse(input);
    if (!parsed.success || !cache.accept(parsed.data.messageId)) return;
    void invalidations(queryClient)[parsed.data.resource]();
  };
}

function invalidations(
  queryClient: QueryClient,
): Record<RealtimeResource, () => Promise<void>> {
  return {
    [REALTIME_RESOURCE.friendships]: () => invalidate(queryClient, ["friends"]),
    [REALTIME_RESOURCE.campaigns]: () => invalidate(queryClient, ["campaigns"]),
    [REALTIME_RESOURCE["campaign-invitations"]]: () =>
      invalidate(queryClient, ["campaigns"]),
  };
}

async function invalidate(
  queryClient: QueryClient,
  queryKey: readonly string[],
): Promise<void> {
  await queryClient.invalidateQueries({ queryKey });
}

/**
 * Une seule tentative à la fois, remise à zéro par l'événement `connect`.
 *
 * Sans ce verrou, une cause que le renouvellement ne corrige pas — une origine
 * hors liste blanche — ferait boucler refresh et reconnexion indéfiniment.
 */
let recovering = false;

/**
 * `disconnect()` d'abord : il coupe la reconnexion automatique de Socket.IO, qui
 * repartirait sinon avec le cookie encore expiré avant la fin du renouvellement.
 */
export async function recoverSession(): Promise<void> {
  if (recovering) return;
  recovering = true;
  realtimeClient.disconnect();

  try {
    await refreshSession();
  } catch {
    return;
  }
  realtimeClient.connect();
}

/** Réservé aux tests : le verrou est un état de module. */
export function resetRealtimeRecovery(): void {
  recovering = false;
}
