import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema } from "@donjon-dragon/shared";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/shared/api/api", () => ({
  api: { delete: vi.fn() },
}));

import { toast } from "sonner";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { campaignDetailKey } from "@/shared/queries/use-campaign-detail";
import { useCancelInvitation } from "./use-cancel-invitation";

const CAMPAIGN_ID = "3f1a2b4c-5d6e-4f70-8192-a3b4c5d6e7f8";
const INVITEE = "Frodon";

function renderMutation() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");

  const { result } = renderHook(() => useCancelInvitation(CAMPAIGN_ID), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

  return { result, invalidate };
}

async function cancel(displayName: string = INVITEE) {
  vi.mocked(api.delete).mockResolvedValue(undefined);
  const rendered = renderMutation();

  rendered.result.current.mutate(displayName);
  await waitFor(() => expect(rendered.result.current.isSuccess).toBe(true));

  return rendered;
}

function calledUrl(): string {
  return vi.mocked(api.delete).mock.calls[0]?.[0] ?? "";
}

describe("useCancelInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("supprime l'invitation sur sa propre route", async () => {
    await cancel();

    expect(calledUrl()).toBe(
      `/api/campaigns/${CAMPAIGN_ID}/invitations/${INVITEE}`,
    );
  });

  // Le bug corrigé : l'invité n'a jamais rejoint la campagne, la route des
  // membres refuserait son pseudo.
  it("n'appelle jamais la route de retrait d'un membre", async () => {
    await cancel();

    expect(calledUrl()).not.toBe(
      API_ROUTES.campaigns.removeMember(CAMPAIGN_ID, INVITEE),
    );
    expect(calledUrl()).not.toContain("/members/");
  });

  it("encode le pseudo, qui n'est pas garanti sûr dans une URL", async () => {
    await cancel("Bilbo Sacquet/42");

    expect(calledUrl()).toBe(
      `/api/campaigns/${CAMPAIGN_ID}/invitations/Bilbo%20Sacquet%2F42`,
    );
  });

  it("signe la commande d'un identifiant d'idempotence UUID", async () => {
    await cancel();

    const headers = vi.mocked(api.delete).mock.calls[0]?.[1];
    expect(IdempotencyKeySchema.safeParse(headers?.[IDEMPOTENCY_KEY_HEADER]).success).toBe(
      true,
    );
  });

  it("recharge le détail : la ligne en attente doit disparaître", async () => {
    const { invalidate } = await cancel();

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: campaignDetailKey(CAMPAIGN_ID),
    });
    expect(toast.success).toHaveBeenCalledWith(`Invitation de ${INVITEE} annulée`);
  });

  it("ne recharge rien quand l'annulation échoue", async () => {
    vi.mocked(api.delete).mockRejectedValue(new Error("boom"));
    const { result, invalidate } = renderMutation();

    result.current.mutate(INVITEE);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Impossible d'annuler cette invitation"),
    );
    expect(invalidate).not.toHaveBeenCalled();
  });
});
