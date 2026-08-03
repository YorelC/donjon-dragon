import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFriendsTabs } from "./use-friends-tabs";

describe("useFriendsTabs", () => {
  it("should initialize with 'friends' as activeTab", () => {
    const { result } = renderHook(() => useFriendsTabs());

    expect(result.current.activeTab).toBe("friends");
  });

  it("should allow changing activeTab to 'received'", () => {
    const { result } = renderHook(() => useFriendsTabs());

    act(() => {
      result.current.setActiveTab("received");
    });

    expect(result.current.activeTab).toBe("received");
  });

  it("should allow changing activeTab to 'sent'", () => {
    const { result } = renderHook(() => useFriendsTabs());

    act(() => {
      result.current.setActiveTab("sent");
    });

    expect(result.current.activeTab).toBe("sent");
  });

  it("should allow changing activeTab to 'search'", () => {
    const { result } = renderHook(() => useFriendsTabs());

    act(() => {
      result.current.setActiveTab("search");
    });

    expect(result.current.activeTab).toBe("search");
  });

  it("should allow cycling through all tabs", () => {
    const { result } = renderHook(() => useFriendsTabs());

    act(() => {
      result.current.setActiveTab("received");
    });
    expect(result.current.activeTab).toBe("received");

    act(() => {
      result.current.setActiveTab("sent");
    });
    expect(result.current.activeTab).toBe("sent");

    act(() => {
      result.current.setActiveTab("search");
    });
    expect(result.current.activeTab).toBe("search");

    act(() => {
      result.current.setActiveTab("friends");
    });
    expect(result.current.activeTab).toBe("friends");
  });
});

// ── Matrice de couverture UA ─────────────────────────────────────────────────
// Aucune UA couverte ici : useFriendsTabs gère simplement l'état de l'onglet actif.
// Les UA qui concernent la navigation entre onglets (ex: UA-009 refetch au clic)
// sont des tests d'intégration ou e2e, pas de ce hook unitaire.
