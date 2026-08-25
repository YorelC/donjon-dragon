import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema } from "@donjon-dragon/shared";
import { ApiError } from "@/shared/api/api-error";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/shared/api/api", async () => {
  const { ApiError: RealApiError } = await import("@/shared/api/api-error");
  return { api: { post: vi.fn() }, ApiError: RealApiError };
});

import { toast } from "sonner";
import { api } from "@/shared/api/api";
import { useInviteToCampaign, toInviteErrorMessage } from "./use-invite-to-campaign";
import { campaignDetailKey } from "@/shared/queries/use-campaign-detail";

const CAMPAIGN_ID = "3f1a2b4c-5d6e-4f70-8192-a3b4c5d6e7f8";

function renderMutation() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");

  const { result } = renderHook(() => useInviteToCampaign(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

  return { result, invalidate };
}

describe("toInviteErrorMessage", () => {
  it.each([
    [403, "Tu ne peux inviter que tes amis."],
    [404, "Aucun joueur ne porte ce pseudo."],
    [409, "Ce joueur est déjà membre de la campagne ou a déjà une invitation en attente."],
  ])("traduit le statut %s en un geste à faire", (status, expected) => {
    expect(toInviteErrorMessage(new ApiError(status, "peu importe"))).toBe(expected);
  });

  it("retombe sur un message générique pour un statut non prévu", () => {
    expect(toInviteErrorMessage(new ApiError(500, "boom"))).toBe(
      "Impossible d'envoyer l'invitation.",
    );
  });

  it("retombe sur un message générique hors ApiError", () => {
    expect(toInviteErrorMessage(new Error("réseau"))).toBe(
      "Impossible d'envoyer l'invitation.",
    );
  });
});

describe("useInviteToCampaign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("poste le pseudo sur la route de la campagne visée", async () => {
    vi.mocked(api.post).mockResolvedValue(undefined);
    const { result } = renderMutation();

    result.current.mutate({ campaignId: CAMPAIGN_ID, displayName: "Frodon" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith(
      `/api/campaigns/${CAMPAIGN_ID}/invitations`,
      { displayName: "Frodon" },
      expect.objectContaining({
        [IDEMPOTENCY_KEY_HEADER]: expect.any(String),
      }),
    );
  });

  // Sans clé valide le serveur refuse la commande : c'est le contrat, pas un détail.
  it("signe la commande d'un identifiant d'idempotence UUID", async () => {
    vi.mocked(api.post).mockResolvedValue(undefined);
    const { result } = renderMutation();

    result.current.mutate({ campaignId: CAMPAIGN_ID, displayName: "Frodon" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const headers = vi.mocked(api.post).mock.calls[0]?.[2];
    expect(IdempotencyKeySchema.safeParse(headers?.[IDEMPOTENCY_KEY_HEADER]).success).toBe(
      true,
    );
  });

  it("recharge le détail : l'invité doit apparaître en attente sans rechargement", async () => {
    vi.mocked(api.post).mockResolvedValue(undefined);
    const { result, invalidate } = renderMutation();

    result.current.mutate({ campaignId: CAMPAIGN_ID, displayName: "Frodon" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: campaignDetailKey(CAMPAIGN_ID),
    });
  });

  it("nomme l'invité dans la confirmation", async () => {
    vi.mocked(api.post).mockResolvedValue(undefined);
    const { result } = renderMutation();

    result.current.mutate({ campaignId: CAMPAIGN_ID, displayName: "Frodon" });

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Invitation envoyée à Frodon"),
    );
  });

  it("explique un refus lié à l'amitié", async () => {
    vi.mocked(api.post).mockRejectedValue(new ApiError(403, "forbidden"));
    const { result } = renderMutation();

    result.current.mutate({ campaignId: CAMPAIGN_ID, displayName: "Sam" });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Tu ne peux inviter que tes amis."),
    );
  });

  it("ne recharge rien quand l'invitation échoue", async () => {
    vi.mocked(api.post).mockRejectedValue(new ApiError(409, "conflict"));
    const { result, invalidate } = renderMutation();

    result.current.mutate({ campaignId: CAMPAIGN_ID, displayName: "Sam" });

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(invalidate).not.toHaveBeenCalled();
  });
});
