import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FriendsListView } from "./friends-list.view";
import type { FriendRemoval } from "../hooks/use-friend-removal";
import type { QueryState } from "@/shared/types/ui-state";
import type { AcceptedFriend } from "@/shared/types/friend";

const mockFriends: AcceptedFriend[] = [
  { friendshipId: "uuid-1", friend: { displayName: "Gandalf" } },
  { friendshipId: "uuid-2", friend: { displayName: "Frodon Sacquet" } },
  { friendshipId: "uuid-3", friend: { displayName: "Aragorn" } },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function removalState(overrides: Partial<FriendRemoval> = {}): FriendRemoval {
  return {
    selectedFriendId: null,
    isPending: false,
    onClick: vi.fn(),
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
}

function queryState(
  overrides: Partial<QueryState<AcceptedFriend[]>> = {},
): QueryState<AcceptedFriend[]> {
  return { data: mockFriends, loading: false, error: false, ...overrides };
}

function renderList(
  removal: FriendRemoval = removalState(),
  friends: QueryState<AcceptedFriend[]> = queryState(),
) {
  return render(<FriendsListView friends={friends} removal={removal} />);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("FriendsListView (pure view)", () => {
  describe("affichage normal", () => {
    it("should display loading state when loading is true", () => {
      renderList(removalState(), queryState({ data: [], loading: true }));

      expect(screen.getByText(/Chargement\.\.\./i)).toBeInTheDocument();
    });

    it("should display error state when error is true", () => {
      renderList(removalState(), queryState({ data: [], error: true }));

      expect(
        screen.getByText(/Erreur lors du chargement des amis\./i),
      ).toBeInTheDocument();
    });

    it("should display empty state when no friends and not loading/error", () => {
      renderList(removalState(), queryState({ data: [] }));
      expect(screen.getByText(/Aucun compagnon dans votre liste pour l'instant\./i)).toBeInTheDocument();
    });

    it("should display all friends with their display names", () => {
      renderList();
      expect(screen.getByText("Gandalf")).toBeInTheDocument();
      expect(screen.getByText("Frodon Sacquet")).toBeInTheDocument();
      expect(screen.getByText("Aragorn")).toBeInTheDocument();
    });
  });

  describe("UA-001 — Ouverture de la modale de confirmation", () => {
    it.each([
      { id: "uuid-1", name: "Gandalf" },
      { id: "uuid-2", name: "Frodon Sacquet" },
      { id: "uuid-3", name: "Aragorn" },
    ])(
      "affiche le message 'Voulez-vous vraiment supprimer $name ?' quand selectedFriendId=$id",
      ({ id, name }) => {
        renderList(removalState({ selectedFriendId: id }));

        expect(
          screen.getByText(`Voulez-vous vraiment supprimer ${name} ?`),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Annuler/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^Supprimer$/i })).toBeInTheDocument();
      },
    );

    it("n'affiche pas la modale quand selectedFriendId est null", () => {
      renderList();
      expect(
        screen.queryByText(/Voulez-vous vraiment supprimer/i),
      ).not.toBeInTheDocument();
    });

    it("appelle onClick(friendshipId) quand le bouton Retirer de la ligne est cliqué", async () => {
      const onClick = vi.fn();
      renderList(removalState({ onClick }));

      const buttons = screen.getAllByRole("button", { name: /Retirer/i });
      await userEvent.click(buttons[2]!); // Aragorn

      expect(onClick).toHaveBeenCalledWith("uuid-3");
    });

    it("affiche un bouton Retirer par ami", () => {
      renderList();
      // Note: when selectedFriendId is null, only card buttons are visible
      const buttons = screen.getAllByRole("button", { name: /Retirer/i });
      expect(buttons).toHaveLength(3);
    });
  });

  describe("UA-002 — Fermeture par 'Annuler'", () => {
    it("appelle onCancel quand on clique Annuler dans la modale", async () => {
      const onCancel = vi.fn();
      renderList(removalState({ selectedFriendId: "uuid-1", onCancel }));

      await userEvent.click(screen.getByRole("button", { name: /Annuler/i }));
      // Note: onCancel is called from BOTH the button click AND
      // AlertDialog's onOpenChange(false) handler when the modal closes
      expect(onCancel).toHaveBeenCalled();
    });

    it("INV-005: la touche Escape appelle onCancel sans appeler onConfirm", async () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      renderList(
        removalState({ selectedFriendId: "uuid-1", onConfirm, onCancel }),
      );

      // Vérifier que la modale est ouverte
      expect(
        screen.getByText("Voulez-vous vraiment supprimer Gandalf ?"),
      ).toBeInTheDocument();

      // Escape ferme la modale via onOpenChange(false) → onCancel
      await userEvent.keyboard("{Escape}");

      // Aucun appel API (onConfirm n'est pas appelé)
      expect(onConfirm).not.toHaveBeenCalled();
      // onCancel est appelé par onOpenChange(false) de AlertDialog
      expect(onCancel).toHaveBeenCalled();
      // Note: la modale reste ouverte dans le rendu car selectedFriendId
      // est contrôlé par le parent (le view est pure — pas d'état local)
    });
  });

  describe("UA-003 — Confirmation de suppression", () => {
    it("appelle onConfirm quand on clique Supprimer dans la modale", async () => {
      const onConfirm = vi.fn();
      renderList(removalState({ selectedFriendId: "uuid-1", onConfirm }));

      await userEvent.click(screen.getByRole("button", { name: /^Supprimer$/i }));
      expect(onConfirm).toHaveBeenCalledOnce();
    });

    it("INV-003: désactive les boutons et affiche 'Suppression...' quand isPending est true", () => {
      renderList(removalState({ isPending: true }));

      // Card buttons show "Suppression..." when pending
      const buttons = screen.getAllByRole("button", { name: /Suppression\.\.\./i });
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it("INV-003: désactive Supprimer dans la modale quand isPending est true", () => {
      renderList(removalState({ selectedFriendId: "uuid-1", isPending: true }));

      // Modal Annuler is NOT disabled per spec (UA-003 only disables Supprimer)
      const cancelButton = screen.getByRole("button", { name: /Annuler/i });
      expect(cancelButton).not.toBeDisabled();
      // Modal Supprimer button is disabled during pending
      const confirmButton = screen.getByRole("button", { name: /^Supprimer$/i });
      expect(confirmButton).toBeDisabled();
    });
  });

  describe("Nommage de l'ami dans la modale", () => {
    it("titre et description portent le nom de la ligne cliquée, sans lookup externe", () => {
      renderList(removalState({ selectedFriendId: "uuid-2" }));

      expect(
        screen.getByText("Supprimer Frodon Sacquet ?"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Voulez-vous vraiment supprimer Frodon Sacquet ?"),
      ).toBeInTheDocument();
    });
  });
});
