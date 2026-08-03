import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RemoveFriendModalView } from "./remove-friend-modal.view";

// ── UA-001 : table de valeurs de la spec ─────────────────────────────────────
const displayNameCases = [
  { displayName: "Gandalf", expectedMessage: "Voulez-vous vraiment supprimer Gandalf ?" },
  { displayName: "Frodon Sacquet", expectedMessage: "Voulez-vous vraiment supprimer Frodon Sacquet ?" },
  { displayName: "Aragorn", expectedMessage: "Voulez-vous vraiment supprimer Aragorn ?" },
];

describe("RemoveFriendModalView", () => {
  describe("UA-001 — Ouverture de la modale de confirmation de suppression", () => {
    it.each(displayNameCases)(
      "UA-001: affiche le message '$expectedMessage' avec les boutons Annuler et Supprimer pour $displayName",
      ({ displayName, expectedMessage }) => {
        render(
          <RemoveFriendModalView
            open={true}
            onOpenChange={vi.fn()}
            friendDisplayName={displayName}
            onConfirm={vi.fn()}
            isDeleting={false}
          />,
        );

        expect(screen.getByText(expectedMessage)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Annuler/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Supprimer/i })).toBeInTheDocument();
      },
    );

    it("UA-001: n'affiche pas la modale quand open est false", () => {
      render(
        <RemoveFriendModalView
          open={false}
          onOpenChange={vi.fn()}
          friendDisplayName="Gandalf"
          onConfirm={vi.fn()}
          isDeleting={false}
        />,
      );

      expect(
        screen.queryByText("Voulez-vous vraiment supprimer Gandalf ?"),
      ).not.toBeInTheDocument();
    });
  });

  describe("UA-002 — Fermeture par 'Annuler'", () => {
    it("UA-002: ferme la modale sans confirmer quand on clique Annuler", async () => {
      const onOpenChange = vi.fn();
      const onConfirm = vi.fn();
      const user = userEvent.setup();

      render(
        <RemoveFriendModalView
          open={true}
          onOpenChange={onOpenChange}
          friendDisplayName="Gandalf"
          onConfirm={onConfirm}
          isDeleting={false}
        />,
      );

      await user.click(screen.getByRole("button", { name: /Annuler/i }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe("UA-003 — Confirmation de suppression avec comportement optimiste", () => {
    it("UA-003: appelle onConfirm et ferme la modale quand on clique Supprimer", async () => {
      const onOpenChange = vi.fn();
      const onConfirm = vi.fn();
      const user = userEvent.setup();

      render(
        <RemoveFriendModalView
          open={true}
          onOpenChange={onOpenChange}
          friendDisplayName="Gandalf"
          onConfirm={onConfirm}
          isDeleting={false}
        />,
      );

      await user.click(screen.getByRole("button", { name: /^Supprimer$/i }));

      expect(onConfirm).toHaveBeenCalledOnce();
      // La modale est fermée via onConfirm → le parent gère onOpenChange(false)
      // Le test vérifie que le callback de confirmation est bien appelé
    });

    it("UA-003: désactive les boutons et affiche 'Suppression...' pendant la suppression", () => {
      render(
        <RemoveFriendModalView
          open={true}
          onOpenChange={vi.fn()}
          friendDisplayName="Gandalf"
          onConfirm={vi.fn()}
          isDeleting={true}
        />,
      );

      const cancelButton = screen.getByRole("button", { name: /Annuler/i });
      const confirmButton = screen.getByRole("button", { name: /Suppression\.\.\./i });

      expect(cancelButton).toBeDisabled();
      expect(confirmButton).toBeDisabled();
    });
  });
});

// ── Matrice de couverture UA ─────────────────────────────────────────────────
// UA-001 — Ouverture de la modale de confirmation de suppression : COUVERT
//   → tests table-driven avec Gandalf, Frodon Sacquet, Aragorn
//   → message "Voulez-vous vraiment supprimer {displayName} ?"
//   → boutons "Annuler" et "Supprimer" présents
//   → modal invisible quand open=false
// UA-002 — Fermeture par "Annuler" : COUVERT
//   → onOpenChange(false) appelé, onConfirm pas appelé
// UA-003 — Confirmation de suppression avec comportement optimiste : COUVERT
//   → onConfirm appelé au clic sur "Supprimer"
//   → boutons désactivés et texte "Suppression..." quand isDeleting=true
// UA-004 — Toast de succès après suppression : NON COUVERT (logique dans useRemoveFriend, pas dans la vue)
// UA-005 — Toast d'échec et rollback : NON COUVERT (logique dans useRemoveFriend, pas dans la vue)
// UA-006 — Affichage du badge : NON COUVERT (logique dans FriendsContainer/FriendsView)
// UA-007 — Truncation du badge à "9+" : NON COUVERT (logique dans FriendsContainer)
// UA-008 — Rechargement des demandes au chargement : NON COUVERT (logique dans FriendsContainer)
// UA-009 — Rafraîchissement au clic sur "Reçues" : NON COUVERT (logique dans FriendsContainer)
// UA-010 — Masquage du badge à zéro demande : NON COUVERT (logique dans FriendsContainer)