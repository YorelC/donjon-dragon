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

describe("FriendsListView", () => {
  describe("affichage normal", () => {
    it("should display loading state when loading is true", () => {
      render(
        <FriendsListView
          friends={[]}
          loading={true}
          error={false}
          onRemove={vi.fn()}
          removeMutationPending={false}
        />
      );

      expect(screen.getByText(/Chargement\.\.\./i)).toBeInTheDocument();
    });

    it("should display error state when error is true", () => {
      render(
        <FriendsListView
          friends={[]}
          loading={false}
          error={true}
          onRemove={vi.fn()}
          removeMutationPending={false}
        />
      );

      expect(
        screen.getByText(/Erreur lors du chargement des amis\./i)
      ).toBeInTheDocument();
    });

    it("should display empty state when no friends and not loading/error", () => {
      render(
        <FriendsListView
          friends={[]}
          loading={false}
          error={false}
          onRemove={vi.fn()}
          removeMutationPending={false}
        />
      );

      expect(screen.getByText(/Tu n'as pas encore d'amis\./i)).toBeInTheDocument();
    });

    it("should display all friends with their display names", () => {
      render(
        <FriendsListView
          friends={mockFriends}
          loading={false}
          error={false}
          onRemove={vi.fn()}
          removeMutationPending={false}
        />
      );

      expect(screen.getByText("Gandalf")).toBeInTheDocument();
      expect(screen.getByText("Frodon Sacquet")).toBeInTheDocument();
      expect(screen.getByText("Aragorn")).toBeInTheDocument();
    });
  });

  describe("bouton Supprimer", () => {
    it("should display 'Supprimer' for each friend", () => {
      render(
        <FriendsListView
          friends={mockFriends}
          loading={false}
          error={false}
          onRemove={vi.fn()}
          removeMutationPending={false}
        />
      );

      const buttons = screen.getAllByRole("button", { name: /Supprimer/i });
      expect(buttons).toHaveLength(3);
    });

    it("should call onRemove with friendshipId when confirmed in modal", async () => {
      const onRemove = vi.fn();
      render(
        <FriendsListView
          friends={mockFriends}
          loading={false}
          error={false}
          onRemove={onRemove}
          removeMutationPending={false}
        />
      );

      // Click "Supprimer" → modal opens
      const removeButtons = screen.getAllByRole("button", { name: /Supprimer/i });
      await userEvent.click(removeButtons[0]!);

      // Verify modal is open
      expect(
        screen.getByText("Voulez-vous vraiment supprimer Gandalf ?"),
      ).toBeInTheDocument();

      // Click "Supprimer" in modal → calls onRemove
      await userEvent.click(screen.getByRole("button", { name: /^Supprimer$/i }));

      expect(onRemove).toHaveBeenCalledWith("uuid-1");
    });

    it("should show 'Suppression...' when removeMutationPending is true", async () => {
      render(
        <FriendsListView
          friends={mockFriends}
          loading={false}
          error={false}
          onRemove={vi.fn()}
          removeMutationPending={true}
        />
      );

      const buttons = screen.getAllByRole("button", { name: /Suppression\.\.\./i });
      expect(buttons).toHaveLength(3);
    });

    it("should disable button when removeMutationPending is true", async () => {
      const onRemove = vi.fn();
      render(
        <FriendsListView
          friends={mockFriends}
          loading={false}
          error={false}
          onRemove={onRemove}
          removeMutationPending={true}
        />
      );

      const buttons = screen.getAllByRole("button", {
        name: /Suppression\.\.\./i,
      });
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });
});

// ── Matrice de couverture UA ─────────────────────────────────────────────────
// UA-001 — Ouverture de la modale de confirmation de suppression : non couvert (modal n'existe pas encore dans FriendsListView)
// UA-002 — Fermeture par "Annuler" : non couvert (modal n'existe pas encore)
// UA-003 — Confirmation de suppression avec comportement optimiste : non couvert (modal + logique de suppression optimiste non testée ici)
// UA-004 — Toast de succès après suppression : non couvert (toast non géré dans FriendsListView)
// UA-005 — Toast d'échec et rollback : non couvert (rollback non testé ici)
//
// Les UA-001 à UA-005 concernent la modale de suppression qui est une
// nouvelle fonctionnalité à implémenter. FriendsListView ne contient que
// la liste d'amis et le bouton de suppression.
//
// Les tests ci-dessus couvrent l'affichage de la liste d'amis (partie existante).
