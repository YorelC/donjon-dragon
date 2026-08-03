import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FriendsListView } from "./friends-list.view";
import type { AcceptedFriend } from "../types/friends-schema";

const mockFriends: AcceptedFriend[] = [
  {
    friendshipId: "uuid-1",
    friend: {
      id: "user-1",
      email: "gandalf@example.com",
      displayName: "Gandalf",
      createdAt: "2025-01-01T00:00:00Z",
      emailVerified: true,
    },
  },
  {
    friendshipId: "uuid-2",
    friend: {
      id: "user-2",
      email: "frodon@example.com",
      displayName: "Frodon Sacquet",
      createdAt: "2025-01-02T00:00:00Z",
      emailVerified: true,
    },
  },
  {
    friendshipId: "uuid-3",
    friend: {
      id: "user-3",
      email: "aragorn@example.com",
      displayName: "Aragorn",
      createdAt: "2025-01-03T00:00:00Z",
      emailVerified: true,
    },
  },
];

/** Helper: returns the friend displayName for a given friendshipId */
function displayName(friendshipId: string) {
  return (
    mockFriends.find((f) => f.friendshipId === friendshipId)?.friend.displayName
    ?? "cet ami"
  );
}

const defaultProps = {
  friends: mockFriends,
  loading: false,
  error: false,
  selectedFriendId: null as string | null,
  friendDisplayName: displayName,
  isDeletePending: false,
  onDeleteClick: vi.fn(),
  onDeleteConfirm: vi.fn(),
  onDeleteCancel: vi.fn(),
};

describe("FriendsListView (pure view)", () => {
  describe("affichage normal", () => {
    it("should display loading state when loading is true", () => {
      render(<FriendsListView {...defaultProps} friends={[]} loading={true} />);
      expect(screen.getByText(/Chargement\.\.\./i)).toBeInTheDocument();
    });

    it("should display error state when error is true", () => {
      render(
        <FriendsListView {...defaultProps} friends={[]} loading={false} error={true} />,
      );
      expect(
        screen.getByText(/Erreur lors du chargement des amis\./i),
      ).toBeInTheDocument();
    });

    it("should display empty state when no friends and not loading/error", () => {
      render(
        <FriendsListView {...defaultProps} friends={[]} loading={false} error={false} />,
      );
      expect(screen.getByText(/Tu n'as pas encore d'amis\./i)).toBeInTheDocument();
    });

    it("should display all friends with their display names", () => {
      render(<FriendsListView {...defaultProps} />);
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
        render(
          <FriendsListView
            {...defaultProps}
            selectedFriendId={id}
            friendDisplayName={displayName}
          />,
        );

        expect(
          screen.getByText(`Voulez-vous vraiment supprimer ${name} ?`),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Annuler/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^Supprimer$/i })).toBeInTheDocument();
      },
    );

    it("n'affiche pas la modale quand selectedFriendId est null", () => {
      render(<FriendsListView {...defaultProps} selectedFriendId={null} />);
      expect(
        screen.queryByText(/Voulez-vous vraiment supprimer/i),
      ).not.toBeInTheDocument();
    });

    it("appelle onDeleteClick(friendshipId) quand le bouton Supprimer de la carte est cliqué", async () => {
      const onDeleteClick = vi.fn();
      render(<FriendsListView {...defaultProps} onDeleteClick={onDeleteClick} />);

      const buttons = screen.getAllByRole("button", { name: /Supprimer/i });
      await userEvent.click(buttons[2]!); // Aragorn

      expect(onDeleteClick).toHaveBeenCalledWith("uuid-3");
    });

    it("affiche un bouton Supprimer par ami", () => {
      render(<FriendsListView {...defaultProps} />);
      // Note: when selectedFriendId is null, only card buttons are visible
      const buttons = screen.getAllByRole("button", { name: /Supprimer/i });
      expect(buttons).toHaveLength(3);
    });
  });

  describe("UA-002 — Fermeture par 'Annuler'", () => {
    it("appelle onDeleteCancel quand on clique Annuler dans la modale", async () => {
      const onDeleteCancel = vi.fn();
      render(
        <FriendsListView
          {...defaultProps}
          selectedFriendId="uuid-1"
          friendDisplayName={() => "Gandalf"}
          onDeleteCancel={onDeleteCancel}
        />,
      );

      await userEvent.click(screen.getByRole("button", { name: /Annuler/i }));
      // Note: onDeleteCancel is called from BOTH the button click AND
      // AlertDialog's onOpenChange(false) handler when the modal closes
      expect(onDeleteCancel).toHaveBeenCalled();
    });

    it("INV-005: la touche Escape appelle onDeleteCancel sans appeler onDeleteConfirm", async () => {
      const onDeleteConfirm = vi.fn();
      const onDeleteCancel = vi.fn();
      render(
        <FriendsListView
          {...defaultProps}
          selectedFriendId="uuid-1"
          friendDisplayName={() => "Gandalf"}
          onDeleteConfirm={onDeleteConfirm}
          onDeleteCancel={onDeleteCancel}
        />,
      );

      // Vérifier que la modale est ouverte
      expect(
        screen.getByText("Voulez-vous vraiment supprimer Gandalf ?"),
      ).toBeInTheDocument();

      // Escape ferme la modale via onOpenChange(false) → onDeleteCancel
      await userEvent.keyboard("{Escape}");

      // Aucun appel API (onDeleteConfirm n'est pas appelé)
      expect(onDeleteConfirm).not.toHaveBeenCalled();
      // onDeleteCancel est appelé par onOpenChange(false) de AlertDialog
      expect(onDeleteCancel).toHaveBeenCalled();
      // Note: la modale reste ouverte dans le rendu car selectedFriendId
      // est contrôlé par le parent (le view est pure — pas d'état local)
    });
  });

  describe("UA-003 — Confirmation de suppression", () => {
    it("appelle onDeleteConfirm quand on clique Supprimer dans la modale", async () => {
      const onDeleteConfirm = vi.fn();
      render(
        <FriendsListView
          {...defaultProps}
          selectedFriendId="uuid-1"
          friendDisplayName={() => "Gandalf"}
          onDeleteConfirm={onDeleteConfirm}
        />,
      );

      await userEvent.click(screen.getByRole("button", { name: /^Supprimer$/i }));
      expect(onDeleteConfirm).toHaveBeenCalledOnce();
    });

    it("INV-003: désactive les boutons et affiche 'Suppression...' quand isDeletePending est true", () => {
      render(
        <FriendsListView
          {...defaultProps}
          isDeletePending={true}
        />,
      );

      // Card buttons show "Suppression..." when pending
      const buttons = screen.getAllByRole("button", { name: /Suppression\.\.\./i });
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it("INV-003: désactive Supprimer dans la modale quand isDeletePending est true", () => {
      render(
        <FriendsListView
          {...defaultProps}
          selectedFriendId="uuid-1"
          friendDisplayName={() => "Gandalf"}
          isDeletePending={true}
        />,
      );

      // Modal Annuler is NOT disabled per spec (UA-003 only disables Supprimer)
      const cancelButton = screen.getByRole("button", { name: /Annuler/i });
      expect(cancelButton).not.toBeDisabled();
      // Modal Supprimer button is disabled during pending
      const confirmButton = screen.getByRole("button", { name: /^Supprimer$/i });
      expect(confirmButton).toBeDisabled();
    });
  });
});