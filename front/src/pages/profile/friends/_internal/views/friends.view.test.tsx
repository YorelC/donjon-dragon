import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { FriendsView } from "./friends.view";

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderView(receivedCount?: number) {
  return render(
    <FriendsView
      activeTab="friends"
      onTabChange={vi.fn()}
      receivedCount={receivedCount}
      friendsPanel={<div>Friends List</div>}
      receivedPanel={<div>Received Requests</div>}
      sentPanel={<div>Sent Requests</div>}
      searchPanel={<div>Search</div>}
    />,
  );
}

function getReceivedTrigger() {
  return screen.getByText("Reçues").closest("button");
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("FriendsView — Badge de demandes en attente", () => {
  describe("UA-006 — Affichage du badge de demandes sur l'onglet 'Reçues'", () => {
    it.each([
      { count: 1, expected: "1" },
      { count: 3, expected: "3" },
      { count: 9, expected: "9" },
    ])("affiche le badge '$expected' pour $count demande(s) reçue(s)", ({ count, expected }) => {
      renderView(count);

      const badge = screen.getByText(expected);
      expect(badge).toBeInTheDocument();

      // Le badge se trouve dans le TabsTrigger "Reçues"
      const trigger = getReceivedTrigger();
      expect(trigger).toBeInTheDocument();
      expect(within(trigger!).getByText(expected)).toBeInTheDocument();
    });
  });

  describe("UA-007 — Truncation du badge à '9+'", () => {
    it.each([
      { count: 10, expected: "9+" },
      { count: 15, expected: "9+" },
      { count: 99, expected: "9+" },
    ])("affiche '$expected' pour $count demandes reçues", ({ count, expected }) => {
      renderView(count);

      const badge = screen.getByText(expected);
      expect(badge).toBeInTheDocument();

      const trigger = getReceivedTrigger();
      expect(within(trigger!).getByText(expected)).toBeInTheDocument();
    });
  });

  describe("UA-010 — Masquage du badge à zéro demande", () => {
    it("n'affiche aucun badge quand count === 0", () => {
      renderView(0);

      expect(screen.queryByText(/^[0-9]+$/)).not.toBeInTheDocument();
      expect(screen.queryByText("9+")).not.toBeInTheDocument();
    });

    it("n'affiche aucun badge quand receivedCount est undefined", () => {
      renderView(undefined);

      expect(screen.queryByText(/^[0-9]+$/)).not.toBeInTheDocument();
      expect(screen.queryByText("9+")).not.toBeInTheDocument();
    });
  });

  describe("INV-007 — Badge conditionnel", () => {
    it("affiche le badge quand count > 0", () => {
      renderView(5);
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("cache le badge quand count === 0", () => {
      renderView(0);
      expect(screen.queryByText("0")).not.toBeInTheDocument();
    });
  });

  describe("INV-008 — Truncation badge '9+' et aria-label", () => {
    it("affiche le badge avec aria-label correct pour count <= 9", () => {
      renderView(5);

      const badge = screen.getByText("5");
      expect(badge).toHaveAttribute("aria-label", "5 demandes en attente");
    });

    it("affiche le badge '9+' avec aria-label correct pour count > 9", () => {
      renderView(42);

      const badge = screen.getByText("9+");
      expect(badge).toHaveAttribute("aria-label", "Plus de 9 demandes en attente");
    });

    it("affiche le badge '9+' avec aria-label correct pour count = 10 (cas limite)", () => {
      renderView(10);

      const badge = screen.getByText("9+");
      expect(badge).toHaveAttribute("aria-label", "Plus de 9 demandes en attente");
    });
  });

  describe("Property-based : règle d'affichage pour count ∈ [0..100]", () => {
    // fast-check non disponible dans le projet ; on génère la matrice
    // manuellement pour couvrir l'espace [0..100].
    const testCases = Array.from({ length: 101 }, (_, i) => {
      const count = i;
      let expectedText: string | null;
      let expectedVisible: boolean;

      if (count === 0) {
        expectedText = null;    // badge caché
        expectedVisible = false;
      } else if (count <= 9) {
        expectedText = String(count);
        expectedVisible = true;
      } else {
        expectedText = "9+";
        expectedVisible = true;
      }

      return { count, expectedText, expectedVisible };
    });

    it.each(testCases)(
      "∀ count=$count : badge $expectedVisible ? '$expectedText' : caché",
      ({ count, expectedText, expectedVisible }) => {
        renderView(count);

        if (expectedVisible) {
          expect(screen.getByText(expectedText!)).toBeInTheDocument();
        } else {
          expect(screen.queryByTestId("badge-recues")).toBeNull();

          // Vérifier qu'aucun nombre ni 9+ n'apparaît dans la zone de l'onglet "Reçues"
          const trigger = screen.getByText("Reçues").closest("button");
          const triggerText = trigger?.textContent ?? "";
          expect(triggerText).not.toMatch(/[0-9]/);
          expect(triggerText).not.toContain("9+");
        }
      },
    );
  });
});

// ── Matrice de couverture UA ─────────────────────────────────────────────────
// UA-006 — Affichage du badge de demandes sur l'onglet "Reçues" : COUVERT (table-driven : 1, 3, 9)
// UA-007 — Truncation du badge à "9+" : COUVERT (table-driven : 10, 15, 99)
// UA-010 — Masquage du badge à zéro demande : COUVERT (count=0, undefined)
// INV-007 — Badge conditionnel (visible si count>0, caché si count=0) : COUVERT
// INV-008 — Truncation "9+" + aria-label : COUVERT
// Property-based (∀ count ∈ [0..100]) : COUVERT (101 cas générés par Array.from)
//   → règle validée : caché si 0, count si 1-9, 9+ si ≥10
//
// Note: ces tests décrivent le contrat de la spec. Si le badge n'est pas encore
// rendu par FriendsView, les tests échoueront — c'est attendu en dual-sandbox.