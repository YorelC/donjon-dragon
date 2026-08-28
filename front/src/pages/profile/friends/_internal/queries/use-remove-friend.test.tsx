import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useRemoveFriend } from "./use-remove-friend";
import type { AcceptedFriend } from "@/shared/types/friend";

// Mocks
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/shared/api/api", () => ({
  api: {
    delete: vi.fn(),
  },
}));

import { toast } from "sonner";
import { api } from "@/shared/api/api";

// Helpers
const mockFriend = (friendshipId: string, displayName: string): AcceptedFriend => ({
  friendshipId,
  friend: { displayName },
});

// Tests
describe("useRemoveFriend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("INV-002 - Optimistic delete", () => {
    it("retire l'ami du cache avant que l'API reponde", async () => {
      const friends: AcceptedFriend[] = [
        mockFriend("uuid-1", "Gandalf"),
        mockFriend("uuid-2", "Frodon Sacquet"),
        mockFriend("uuid-3", "Aragorn"),
      ];

      vi.mocked(api.delete).mockResolvedValue(undefined);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      queryClient.setQueryData(["friends", "list"], friends);

      const { result } = renderHook(() => useRemoveFriend(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      });

      result.current.mutate("uuid-1");

      // Attendre que l'optimistic update soit applique (onMutate est async)
      await waitFor(() => {
        const updated = queryClient.getQueryData<AcceptedFriend[]>(["friends", "list"]);
        expect(updated).toHaveLength(2);
      });

      const updated = queryClient.getQueryData<AcceptedFriend[]>(["friends", "list"]);
      expect(updated?.find((f) => f.friendshipId === "uuid-1")).toBeUndefined();
      expect(updated?.find((f) => f.friendshipId === "uuid-2")).toBeDefined();
      expect(updated?.find((f) => f.friendshipId === "uuid-3")).toBeDefined();
    });
  });

  describe("INV-004 - Rollback apres echec API", () => {
    it("restaure la liste complete a sa position d'origine quand l'API echoue", async () => {
      const friends: AcceptedFriend[] = [
        mockFriend("uuid-1", "Gandalf"),
        mockFriend("uuid-2", "Frodon Sacquet"),
        mockFriend("uuid-3", "Aragorn"),
      ];

      vi.mocked(api.delete).mockRejectedValue(new Error("Network error"));

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      queryClient.setQueryData(["friends", "list"], friends);

      const { result } = renderHook(() => useRemoveFriend(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      });

      result.current.mutate("uuid-1");

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      const restored = queryClient.getQueryData<AcceptedFriend[]>(["friends", "list"]);
      expect(restored).toEqual(friends);
    });

    it("ne plante pas quand previous est undefined (pas de snapshot)", async () => {
      vi.mocked(api.delete).mockRejectedValue(new Error("Network error"));

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });

      const { result } = renderHook(() => useRemoveFriend(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      });

      result.current.mutate("uuid-1");

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // onMutate met [] dans le cache quand old etait undefined
      // (a cause de old?.filter(...) ?? [])
      const data = queryClient.getQueryData(["friends", "list"]);
      expect(data).toEqual([]);
    });
  });

  describe("UA-004 - Toast de succes apres suppression", () => {
    it("affiche un toast 'Ami supprime' quand l'API repond 2xx", async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      queryClient.setQueryData(["friends", "list"], [mockFriend("uuid-1", "Gandalf")]);

      const { result } = renderHook(() => useRemoveFriend(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      });

      result.current.mutate("uuid-1");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(toast.success).toHaveBeenCalledWith("Ami supprim\u00e9");
    });
  });

  describe("UA-005 - Toast d'echec et rollback", () => {
    it("affiche un toast d'erreur quand l'API echoue", async () => {
      vi.mocked(api.delete).mockRejectedValue(new Error("Network error"));

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      queryClient.setQueryData(["friends", "list"], [mockFriend("uuid-1", "Gandalf")]);

      const { result } = renderHook(() => useRemoveFriend(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      });

      result.current.mutate("uuid-1");

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith(
        "Erreur lors de la suppression. Veuillez r\u00e9essayer.",
      );
    });
  });

  describe("INV-003 - isPending pendant mutation", () => {
    it("retourne isPending a true pendant que la mutation est en cours", async () => {
      let resolvePromise: (() => void) | null = null;
      vi.mocked(api.delete).mockReturnValue(
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        }),
      );

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      queryClient.setQueryData(["friends", "list"], [mockFriend("uuid-1", "Gandalf")]);

      const { result } = renderHook(() => useRemoveFriend(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      });

      result.current.mutate("uuid-1");

      // isPending peut ne pas etre synchrone -- attendre le prochain tick
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      resolvePromise!();
      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });
  });

  describe("INV-004 - cancelQueries BEFORE setQueryData", () => {
    it("appelle cancelQueries AVANT setQueryData lors de la mutation", async () => {
      const friends: AcceptedFriend[] = [mockFriend("uuid-1", "Gandalf")];
      vi.mocked(api.delete).mockResolvedValue(undefined);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      queryClient.setQueryData(["friends", "list"], friends);

      const cancelQueriesSpy = vi.spyOn(queryClient, "cancelQueries");
      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      const { result } = renderHook(() => useRemoveFriend(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      });

      result.current.mutate("uuid-1");

      await waitFor(() => {
        expect(cancelQueriesSpy).toHaveBeenCalledWith({ queryKey: ["friends", "list"] });
      });

      const cancelCallTime = cancelQueriesSpy.mock.invocationCallOrder[0]!;
      const setDataCallTime = setQueryDataSpy.mock.invocationCallOrder[0]!;
      expect(cancelCallTime).toBeLessThan(setDataCallTime);
    });
  });

  describe("INV-004 - onSettled invalidation", () => {
    it("invalide ['friends', 'list'] dans onSettled apres succes", async () => {
      const friends: AcceptedFriend[] = [mockFriend("uuid-1", "Gandalf")];
      vi.mocked(api.delete).mockResolvedValue(undefined);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      queryClient.setQueryData(["friends", "list"], friends);

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useRemoveFriend(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      });

      result.current.mutate("uuid-1");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["friends", "list"] });
    });

    it("invalide ['friends', 'list'] dans onSettled apres echec", async () => {
      const friends: AcceptedFriend[] = [mockFriend("uuid-1", "Gandalf")];
      vi.mocked(api.delete).mockRejectedValue(new Error("Network error"));

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      queryClient.setQueryData(["friends", "list"], friends);

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useRemoveFriend(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      });

      result.current.mutate("uuid-1");

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["friends", "list"] });
    });
  });

  describe("UA-003 - Appel API correct", () => {
    it("appelle api.delete avec le bon friendshipId", async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });

      const { result } = renderHook(() => useRemoveFriend(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      });

      result.current.mutate("uuid-42");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.delete).toHaveBeenCalledWith("/api/friends/uuid-42");
    });
  });
});