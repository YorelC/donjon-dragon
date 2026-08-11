import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/shared/api/api", () => ({
  api: { post: vi.fn() },
}));

import { toast } from "sonner";
import { api } from "@/shared/api/api";
import {
  useAcceptCampaignInvitation,
  useRefuseCampaignInvitation,
} from "./use-answer-campaign-invitation";
import { CAMPAIGN_INVITATIONS_KEY } from "./use-campaign-invitations";
import { INVITATION_COUNT_KEY } from "./use-invitation-count";
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
    );
    expect(toast.success).toHaveBeenCalledWith(message);
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
    expect(INVITATION_COUNT_KEY.slice(0, CAMPAIGN_INVITATIONS_KEY.length)).toEqual([
      ...CAMPAIGN_INVITATIONS_KEY,
    ]);
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
