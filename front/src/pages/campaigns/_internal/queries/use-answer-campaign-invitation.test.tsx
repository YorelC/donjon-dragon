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
import {
  useAcceptCampaignInvitation,
  useRefuseCampaignInvitation,
} from "./use-answer-campaign-invitation";
import { CAMPAIGN_INVITATIONS_KEY } from "./use-campaign-invitations";
import { CAMPAIGN_INVITATION_COUNT_KEY } from "@/shared/queries/use-campaign-invitation-count";
import { MY_CAMPAIGNS_KEY } from "./use-my-campaigns";

const CAMPAIGN_ID = "3f1a2b4c-5d6e-4f70-8192-a3b4c5d6e7f8";

function renderMutation(hook: typeof useAcceptCampaignInvitation) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");

  const { result } = renderHook(() => hook(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

  return { result, invalidate };
}

describe("réponse à une invitation de campagne", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    [useAcceptCampaignInvitation, "accept", "Tu as rejoint la campagne"],
    [useRefuseCampaignInvitation, "refuse", "Demande refusée"],
  ])("poste sur la bonne route et confirme (%#)", async (hook, action, message) => {
    vi.mocked(api.post).mockResolvedValue(undefined);
    const { result } = renderMutation(hook);

    result.current.mutate(CAMPAIGN_ID);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith(
      `/api/campaigns/${CAMPAIGN_ID}/invitations/${action}`,
      {},
      expect.objectContaining({ [IDEMPOTENCY_KEY_HEADER]: expect.any(String) }),
    );
    expect(toast.success).toHaveBeenCalledWith(message);
  });

  it.each([
    [useAcceptCampaignInvitation],
    [useRefuseCampaignInvitation],
  ])("signe la commande d'un identifiant d'idempotence UUID (%#)", async (hook) => {
    vi.mocked(api.post).mockResolvedValue(undefined);
    const { result } = renderMutation(hook);

    result.current.mutate(CAMPAIGN_ID);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const headers = vi.mocked(api.post).mock.calls[0]?.[2];
    expect(IdempotencyKeySchema.safeParse(headers?.[IDEMPOTENCY_KEY_HEADER]).success).toBe(
      true,
    );
  });

  it("invalide les demandes ET mes campagnes : accepter déplace la campagne", async () => {
    vi.mocked(api.post).mockResolvedValue(undefined);
    const { result, invalidate } = renderMutation(useAcceptCampaignInvitation);

    result.current.mutate(CAMPAIGN_ID);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: CAMPAIGN_INVITATIONS_KEY });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: MY_CAMPAIGNS_KEY });
  });

  it("rafraîchit le badge sans le nommer : sa clé a celle des demandes en préfixe", () => {
    expect(
      CAMPAIGN_INVITATION_COUNT_KEY.slice(0, CAMPAIGN_INVITATIONS_KEY.length),
    ).toEqual([...CAMPAIGN_INVITATIONS_KEY]);
  });

  // Le serveur masque en 404 l'absente, la terminale et celle d'un autre : le
  // message ne doit pas laisser deviner laquelle des trois.
  it.each([
    [403, "Tu ne peux pas répondre à cette invitation."],
    [404, "Cette invitation n'est plus disponible."],
    [409, "Cette invitation a déjà été traitée."],
  ])("explique un refus %s sans rien révéler du cycle", async (status, message) => {
    vi.mocked(api.post).mockRejectedValue(new ApiError(status, "peu importe"));
    const { result } = renderMutation(useAcceptCampaignInvitation);

    result.current.mutate(CAMPAIGN_ID);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message));
  });

  it("n'invalide rien quand la réponse échoue", async () => {
    vi.mocked(api.post).mockRejectedValue(new ApiError(404, "not found"));
    const { result, invalidate } = renderMutation(useAcceptCampaignInvitation);

    result.current.mutate(CAMPAIGN_ID);

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("prévient de l'échec", async () => {
    vi.mocked(api.post).mockRejectedValue(new Error("boom"));
    const { result } = renderMutation(useRefuseCampaignInvitation);

    result.current.mutate(CAMPAIGN_ID);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Impossible de refuser la demande"),
    );
  });
});
