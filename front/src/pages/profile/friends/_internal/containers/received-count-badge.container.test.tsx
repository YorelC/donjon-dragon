import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReceivedCountBadgeContainer } from "./received-count-badge.container";
import * as useReceivedCountModule from "../queries/use-received-count";

vi.mock("../queries/use-received-count", async () => {
  const actual = await vi.importActual<typeof useReceivedCountModule>(
    "../queries/use-received-count",
  );
  return { ...actual, useReceivedCount: vi.fn() };
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockCount(data: { count: number } | undefined) {
  vi.mocked(useReceivedCountModule.useReceivedCount).mockReturnValue({
    data,
  } as unknown as ReturnType<typeof useReceivedCountModule.useReceivedCount>);
}

function renderBadge() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ReceivedCountBadgeContainer />
    </QueryClientProvider>,
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("ReceivedCountBadgeContainer", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("UA-010 / INV-007 — Masquage du badge", () => {
    it("ne rend rien quand le compteur est à zéro", () => {
      mockCount({ count: 0 });

      const { container } = renderBadge();

      expect(container).toBeEmptyDOMElement();
    });

    it("ne rend rien tant que le compteur n'est pas chargé", () => {
      mockCount(undefined);

      const { container } = renderBadge();

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("UA-006 — Affichage du badge dès une demande", () => {
    it("rend le badge quand le compteur est strictement positif", () => {
      mockCount({ count: 4 });

      renderBadge();

      expect(screen.getByText("4")).toBeInTheDocument();
    });
  });
});

// ── Matrice de couverture UA ─────────────────────────────────────────────────
// UA-010 — Masquage du badge à zéro demande : COUVERT (count=0, data undefined)
// INV-007 — Badge conditionnel (visible si count>0, caché sinon) : COUVERT
// UA-006 / UA-007 / INV-008 — mise en forme du nombre : received-count-badge.view.test.tsx
