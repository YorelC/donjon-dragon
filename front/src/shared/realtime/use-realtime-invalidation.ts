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
    const resourceChanged = createRealtimeInvalidationListener(queryClient);
    const sessionExpired = () => void refreshAndReconnect();
    realtimeClient.on(REALTIME_EVENT.resourceChanged, resourceChanged);
    realtimeClient.on(REALTIME_EVENT.sessionExpired, sessionExpired);
    realtimeClient.connect();
    return () => disconnect(resourceChanged, sessionExpired);
  }, [queryClient, status]);
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

async function refreshAndReconnect(): Promise<void> {
  try {
    await refreshSession();
    realtimeClient.connect();
  } catch {
    return;
  }
}

function disconnect(
  resourceChanged: (input: unknown) => void,
  sessionExpired: () => void,
): void {
  realtimeClient.off(REALTIME_EVENT.resourceChanged, resourceChanged);
  realtimeClient.off(REALTIME_EVENT.sessionExpired, sessionExpired);
  realtimeClient.disconnect();
}
