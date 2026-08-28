import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { REALTIME_RESOURCE } from "@donjon-dragon/shared";
import { RealtimeMessageCache } from "./realtime-message-cache";
import { createRealtimeInvalidationListener } from "./use-realtime-invalidation";

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
