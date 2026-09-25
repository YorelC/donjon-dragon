import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema } from "@donjon-dragon/shared";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/shared/api/api", () => ({
  api: { delete: vi.fn(), post: vi.fn() },
}));

import { api } from "@/shared/api/api";
import { useAssignCharacter, useUnassignCharacter } from "./use-character-mutations";

const CAMPAIGN_ID = "3f1a2b4c-5d6e-4f70-8192-a3b4c5d6e7f8";
const CHARACTER_ID = "660e8400-e29b-41d4-a716-446655440001";
const EXPECTED_REVISION = 4;

describe("commandes d attribution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envoie le joueur, la révision et une clé pour attribuer", async () => {
    vi.mocked(api.post).mockResolvedValue({});
    const { result } = renderMutation(() => useAssignCharacter(CAMPAIGN_ID));

    result.current.mutate({
      characterId: CHARACTER_ID, playerDisplayName: "Frodon", expectedRevision: EXPECTED_REVISION,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.post).toHaveBeenCalledWith(
      `/api/campaigns/${CAMPAIGN_ID}/characters/${CHARACTER_ID}/assign`,
      { playerDisplayName: "Frodon", expectedRevision: EXPECTED_REVISION }, validHeaders(),
    );
    expect(commandHeaderIsValid()).toBe(true);
  });

  it("envoie la révision et une clé pour libérer", async () => {
    vi.mocked(api.post).mockResolvedValue({});
    const { result } = renderMutation(() => useUnassignCharacter(CAMPAIGN_ID));

    result.current.mutate({ characterId: CHARACTER_ID, expectedRevision: EXPECTED_REVISION });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.post).toHaveBeenCalledWith(
      `/api/campaigns/${CAMPAIGN_ID}/characters/${CHARACTER_ID}/unassign`,
      { expectedRevision: EXPECTED_REVISION }, validHeaders(),
    );
    expect(commandHeaderIsValid()).toBe(true);
  });
});

function renderMutation<T>(hook: () => T) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return renderHook(hook, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

function validHeaders() {
  return { [IDEMPOTENCY_KEY_HEADER]: expect.any(String) };
}

function commandHeaderIsValid(): boolean {
  const headers = vi.mocked(api.post).mock.calls[0]?.[2];
  return IdempotencyKeySchema.safeParse(headers?.[IDEMPOTENCY_KEY_HEADER]).success;
}
