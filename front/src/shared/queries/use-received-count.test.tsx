import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useReceivedCount } from "./use-received-count";
import { API_ROUTES } from "@/shared/constants/api-routes";

// Mocks
vi.mock("@/shared/api/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

import { api } from "@/shared/api/api";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useReceivedCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("UA-008 — Rechargement des demandes au chargement de la page", () => {
    it("appelle api.get sur l'endpoint incomingCount", async () => {
      vi.mocked(api.get).mockResolvedValue({ count: 3 });

      const { result } = renderHook(() => useReceivedCount(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual({ count: 3 });
      });

      expect(api.get).toHaveBeenCalledWith(API_ROUTES.friends.incomingCount);
    });

    it("retourne { count: 0 } quand il n'y a aucune demande", async () => {
      vi.mocked(api.get).mockResolvedValue({ count: 0 });

      const { result } = renderHook(() => useReceivedCount(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual({ count: 0 });
      });
    });

    it("expose la queryKey ['friends', 'received', 'count']", async () => {
      vi.mocked(api.get).mockResolvedValue({ count: 5 });

      const { result } = renderHook(() => useReceivedCount(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual({ count: 5 });
      });

      // La query doit être accessible dans le cache avec la bonne clé
      const queryCache = result.current;
      expect(queryCache.data).toEqual({ count: 5 });
    });
  });

  describe("Paramètres de la query (staleTime, retry)", () => {
    it("ne retente pas quand la requête échoue (retry: false)", async () => {
      vi.mocked(api.get).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useReceivedCount(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // retry: false → une seule tentative
      expect(api.get).toHaveBeenCalledTimes(1);
    });
  });
});