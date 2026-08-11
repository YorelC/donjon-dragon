import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { CampaignSummary } from "@donjon-dragon/shared";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/shared/api/api", () => ({
  api: { post: vi.fn() },
}));

import { toast } from "sonner";
import { api } from "@/shared/api/api";
import { useCreateCampaign } from "./use-create-campaign";
import { MY_CAMPAIGNS_KEY } from "./use-my-campaigns";

const CREATED: CampaignSummary = {
  id: "3f1a2b4c-5d6e-4f70-8192-a3b4c5d6e7f8",
  name: "La Malédiction de Strahd",
  myRole: "gameMaster",
  gameMasterCount: 1,
  playerCount: 0,
};

function renderMutation() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const { result } = renderHook(() => useCreateCampaign(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

  return { result, queryClient };
}

describe("useCreateCampaign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("poste le nom saisi sur la route de création", async () => {
    vi.mocked(api.post).mockResolvedValue(CREATED);
    const { result } = renderMutation();

    result.current.mutate(CREATED.name);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith("/api/campaigns", {
      name: CREATED.name,
    });
  });

  it("ajoute la campagne créée au cache de la liste, sans refetch", async () => {
    vi.mocked(api.post).mockResolvedValue(CREATED);
    const { result, queryClient } = renderMutation();

    result.current.mutate(CREATED.name);

    await waitFor(() =>
      expect(queryClient.getQueryData(MY_CAMPAIGNS_KEY)).toEqual([CREATED]),
    );
  });

  it("conserve les campagnes déjà en cache", async () => {
    vi.mocked(api.post).mockResolvedValue(CREATED);
    const { result, queryClient } = renderMutation();
    const existing: CampaignSummary = { ...CREATED, id: "autre", name: "Avant" };
    queryClient.setQueryData(MY_CAMPAIGNS_KEY, [existing]);

    result.current.mutate(CREATED.name);

    await waitFor(() =>
      expect(queryClient.getQueryData(MY_CAMPAIGNS_KEY)).toEqual([
        existing,
        CREATED,
      ]),
    );
  });

  it("prévient du succès", async () => {
    vi.mocked(api.post).mockResolvedValue(CREATED);
    const { result } = renderMutation();

    result.current.mutate(CREATED.name);

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        `Campagne « ${CREATED.name} » créée`,
      ),
    );
  });

  it("prévient de l'échec et ne touche pas au cache", async () => {
    vi.mocked(api.post).mockRejectedValue(new Error("boom"));
    const { result, queryClient } = renderMutation();

    result.current.mutate(CREATED.name);

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(queryClient.getQueryData(MY_CAMPAIGNS_KEY)).toBeUndefined();
  });
});
