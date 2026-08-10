import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useSendFriendRequest } from "./use-send-friend-request";
import { ApiError } from "@/shared/api/api";
import type { SentRequest } from "../types/friends-schema";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@/shared/api/api", async () => {
  const actual = await vi.importActual<typeof import("@/shared/api/api")>("@/shared/api/api");
  return { ...actual, api: { post: vi.fn() } };
});

import { toast } from "sonner";
import { api } from "@/shared/api/api";

function renderWithClient(queryClient: QueryClient) {
  return renderHook(() => useSendFriendRequest(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

describe("useSendFriendRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ajoute le destinataire au cache 'sent' des la reponse, sans refetch", async () => {
    const request = {
      id: "req-1",
      status: "pending",
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };
    vi.mocked(api.post).mockResolvedValue(request);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderWithClient(queryClient);

    result.current.mutate("Gimli");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const sent = queryClient.getQueryData<SentRequest[]>(["friends", "sent"]);
    expect(sent).toEqual([{ ...request, recipient: { displayName: "Gimli" } }]);
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("ajoute au tableau existant sans ecraser les demandes deja envoyees", async () => {
    const existing: SentRequest = {
      id: "req-0",
      status: "pending",
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      recipient: { displayName: "Frodo" },
    };
    const request = {
      id: "req-1",
      status: "pending",
      createdAt: "2025-01-02T00:00:00Z",
      updatedAt: "2025-01-02T00:00:00Z",
    };
    vi.mocked(api.post).mockResolvedValue(request);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    queryClient.setQueryData(["friends", "sent"], [existing]);
    const { result } = renderWithClient(queryClient);

    result.current.mutate("Gimli");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const sent = queryClient.getQueryData<SentRequest[]>(["friends", "sent"]);
    expect(sent).toHaveLength(2);
    expect(sent?.[0]).toEqual(existing);
    expect(sent?.[1]).toEqual({ ...request, recipient: { displayName: "Gimli" } });
  });

  it("affiche un toast d'info sur 409 sans toucher au cache", async () => {
    vi.mocked(api.post).mockRejectedValue(new ApiError(409, "Conflict"));

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const { result } = renderWithClient(queryClient);

    result.current.mutate("Gimli");

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.info).toHaveBeenCalledWith(
      "Une invitation est déjà en attente pour ce joueur",
    );
    expect(queryClient.getQueryData(["friends", "sent"])).toBeUndefined();
  });

  it("affiche un toast d'erreur generique sur une autre erreur", async () => {
    vi.mocked(api.post).mockRejectedValue(new Error("network down"));

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const { result } = renderWithClient(queryClient);

    result.current.mutate("Gimli");

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith("Impossible d'envoyer l'invitation");
  });
});
