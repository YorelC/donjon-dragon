import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useFriendsTabs } from "./use-friends-tabs";
import { RECEIVED_COUNT_KEY } from "../queries/use-received-count";

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderFriendsTabs() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return { ...renderHook(() => useFriendsTabs(), { wrapper }), invalidateQueries };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("useFriendsTabs", () => {
  it("should initialize with 'friends' as activeTab", () => {
    const { result } = renderFriendsTabs();

    expect(result.current.activeTab).toBe("friends");
  });

  it.each(["received", "sent", "search", "friends"] as const)(
    "should allow changing activeTab to '%s'",
    (tab) => {
      const { result } = renderFriendsTabs();

      act(() => {
        result.current.setActiveTab(tab);
      });

      expect(result.current.activeTab).toBe(tab);
    },
  );

  it("should allow cycling through all tabs", () => {
    const { result } = renderFriendsTabs();

    (["received", "sent", "search", "friends"] as const).forEach((tab) => {
      act(() => {
        result.current.setActiveTab(tab);
      });
      expect(result.current.activeTab).toBe(tab);
    });
  });

  describe("UA-009 — Rafraîchissement du compteur au passage sur 'Reçues'", () => {
    it("invalide la clé du compteur quand l'onglet 'received' devient actif", () => {
      const { result, invalidateQueries } = renderFriendsTabs();

      act(() => {
        result.current.setActiveTab("received");
      });

      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: RECEIVED_COUNT_KEY,
      });
    });

    it.each(["sent", "search", "friends"] as const)(
      "n'invalide rien quand l'onglet '%s' devient actif",
      (tab) => {
        const { result, invalidateQueries } = renderFriendsTabs();

        act(() => {
          result.current.setActiveTab(tab);
        });

        expect(invalidateQueries).not.toHaveBeenCalled();
      },
    );
  });
});

// ── Matrice de couverture UA ─────────────────────────────────────────────────
// UA-009 — Rafraîchissement du count au clic sur l'onglet "Reçues" : COUVERT
//   → le hook invalide RECEIVED_COUNT_KEY, ce qui déclenche le refetch de la
//     query active. Remplace l'ancien refetch() manuel câblé dans la vue.
// Le reste du hook n'est que l'état de l'onglet actif : aucune UA.
