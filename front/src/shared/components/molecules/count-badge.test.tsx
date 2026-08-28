import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CountBadge } from "./count-badge";

describe("CountBadge", () => {
  describe("UA-006 — Affichage du nombre de demandes reçues", () => {
    it.each([
      { count: 1, expected: "1" },
      { count: 3, expected: "3" },
      { count: 9, expected: "9" },
    ])("affiche '$expected' pour $count demande(s)", ({ count, expected }) => {
      render(<CountBadge count={count} />);

      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  describe("UA-007 — Truncation à '9+'", () => {
    it.each([{ count: 10 }, { count: 15 }, { count: 99 }])(
      "affiche '9+' pour $count demandes",
      ({ count }) => {
        render(<CountBadge count={count} />);

        expect(screen.getByText("9+")).toBeInTheDocument();
      },
    );
  });

  describe("INV-008 — aria-label du badge", () => {
    it("annonce le nombre exact jusqu'à 9", () => {
      render(<CountBadge count={5} />);

      expect(
        screen.getByLabelText("5 demandes en attente"),
      ).toBeInTheDocument();
    });

    it.each([{ count: 10 }, { count: 42 }])(
      "annonce 'Plus de 9 demandes en attente' pour $count",
      ({ count }) => {
        render(<CountBadge count={count} />);

        expect(
          screen.getByLabelText("Plus de 9 demandes en attente"),
        ).toBeInTheDocument();
      },
    );
  });

  describe("Property-based : règle d'affichage pour count ∈ [1..100]", () => {
    // fast-check non disponible dans le projet ; on génère la matrice
    // manuellement pour couvrir l'espace [1..100].
    const cases = Array.from({ length: 100 }, (_, index) => {
      const count = index + 1;
      return { count, expected: count <= 9 ? String(count) : "9+" };
    });

    it.each(cases)("∀ count=$count : affiche '$expected'", ({ count, expected }) => {
      render(<CountBadge count={count} />);

      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });
});

// ── Matrice de couverture UA ─────────────────────────────────────────────────
// UA-006 — Affichage du badge de demandes sur l'onglet "Reçues" : COUVERT (1, 3, 9)
// UA-007 — Truncation du badge à "9+" : COUVERT (10, 15, 99)
// INV-008 — Truncation "9+" + aria-label : COUVERT
// Property-based (∀ count ∈ [1..100]) : COUVERT
// UA-010 / INV-007 — Masquage à zéro : hors de cette view, la décision de ne rien
//   rendre appartient au container → pages/profile/friends/_internal/containers/received-count-badge.container.test.tsx
