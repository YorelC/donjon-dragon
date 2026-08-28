import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { REALTIME_RESOURCE } from "@donjon-dragon/shared";
import { refreshSession } from "@/shared/api/refresh";
import { RealtimeMessageCache } from "./realtime-message-cache";
import { realtimeClient } from "./realtime-client";
import {
  createRealtimeInvalidationListener,
  recoverSession,
  resetRealtimeRecovery,
} from "./use-realtime-invalidation";

vi.mock("./realtime-client", () => ({
  realtimeClient: { connect: vi.fn(), disconnect: vi.fn(), on: vi.fn(), off: vi.fn() },
}));
vi.mock("@/shared/api/refresh", () => ({ refreshSession: vi.fn() }));

const refresh = vi.mocked(refreshSession);
const client = vi.mocked(realtimeClient);

const MESSAGE_ID = "11111111-1111-4111-8111-111111111111";

describe("createRealtimeInvalidationListener", () => {
  it("invalide toutes les queries d’amitié une seule fois", () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const listener = createRealtimeInvalidationListener(
      queryClient,
      new RealtimeMessageCache(),
    );
    const message = {
      messageId: MESSAGE_ID,
      resource: REALTIME_RESOURCE.friendships,
    };

    listener(message);
    listener(message);

    expect(invalidate).toHaveBeenCalledOnce();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["friends"] });
  });

  it("ignore un message public mal formé", () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const listener = createRealtimeInvalidationListener(queryClient);

    listener({ messageId: "not-a-uuid", resource: "friendships" });

    expect(invalidate).not.toHaveBeenCalled();
  });
});

/**
 * Un rejet de middleware n'est pas re-tente par Socket.IO v4 : sans recuperation
 * explicite, le client se tait pour toujours.
 */
describe("recoverSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRealtimeRecovery();
    refresh.mockResolvedValue(undefined);
  });

  // L'ordre compte : la reconnexion automatique repartirait avec le cookie encore
  // expire si on ne coupait pas d'abord.
  it("coupe la socket, renouvelle, puis reconnecte", async () => {
    await recoverSession();

    expect(client.disconnect).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledOnce();
    expect(client.connect).toHaveBeenCalledOnce();
  });

  it("ne tente qu une récupération à la fois", async () => {
    await recoverSession();
    await recoverSession();

    expect(refresh).toHaveBeenCalledOnce();
  });

  it("ne reconnecte pas si le renouvellement échoue", async () => {
    refresh.mockRejectedValue(new Error("session morte"));

    await recoverSession();

    expect(client.connect).not.toHaveBeenCalled();
  });
});
