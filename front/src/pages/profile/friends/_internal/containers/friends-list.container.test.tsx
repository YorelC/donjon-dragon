import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FriendsListContainer } from "./friends-list.container";

// Mock queries
vi.mock("@/shared/queries/use-friends");
vi.mock("../queries/use-remove-friend");

import * as useFriendsModule from "@/shared/queries/use-friends";
import * as useRemoveFriendModule from "../queries/use-remove-friend";

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockFriend = (friendshipId: string, displayName: string) => ({
  friendshipId,
  friend: { displayName },
});

const mockFriends = [
  mockFriend("uuid-1", "Gandalf"),
  mockFriend("uuid-2", "Frodon Sacquet"),
  mockFriend("uuid-3", "Aragorn"),
];

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <FriendsListContainer />
      </QueryClientProvider>,
    ),
    queryClient,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("FriendsListContainer", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(useFriendsModule.useFriends).mockReturnValue({
      data: mockFriends,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useFriendsModule.useFriends>);

    vi.mocked(useRemoveFriendModule.useRemoveFriend).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useRemoveFriendModule.useRemoveFriend>);
  });

  describe("UA-001 — Ouverture de la modale de confirmation de suppression", () => {
    it("UA-001: ouvre la modale avec le bon message au clic sur Supprimer", async () => {
      const user = userEvent.setup();
      renderWithProviders();

      const removeButtons = screen.getAllByRole("button", { name: /Supprimer/i });
      await user.click(removeButtons[0]!);

      expect(
        screen.getByText("Voulez-vous vraiment supprimer Gandalf ?"),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Annuler/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Supprimer$/i })).toBeInTheDocument();
    });

    it("UA-001: l'index de l'ami sélectionné est stocké dans selectedFriendId (via onDeleteClick)", async () => {
      const user = userEvent.setup();
      renderWithProviders();

      const removeButtons = screen.getAllByRole("button", { name: /Supprimer/i });
      await user.click(removeButtons[2]!); // Aragorn

      expect(
        screen.getByText("Voulez-vous vraiment supprimer Aragorn ?"),
      ).toBeInTheDocument();
    });
  });

  describe("UA-002 — Fermeture par 'Annuler'", () => {
    it("UA-002: ferme la modale sans appeler la mutation quand on clique Annuler", async () => {
      const mockMutate = vi.fn();
      vi.mocked(useRemoveFriendModule.useRemoveFriend).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useRemoveFriendModule.useRemoveFriend>);

      const user = userEvent.setup();
      renderWithProviders();

      // Ouvrir la modale
      const removeButtons = screen.getAllByRole("button", { name: /Supprimer/i });
      await user.click(removeButtons[0]!);

      expect(
        screen.getByText("Voulez-vous vraiment supprimer Gandalf ?"),
      ).toBeInTheDocument();

      // Cliquer Annuler
      await user.click(screen.getByRole("button", { name: /Annuler/i }));

      // La modale est fermée
      expect(
        screen.queryByText("Voulez-vous vraiment supprimer Gandalf ?"),
      ).not.toBeInTheDocument();
      // Aucun appel API
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe("UA-003 — Confirmation de suppression avec comportement optimiste", () => {
    it("UA-003: ferme la modale et appelle removeFriend(friendshipId)", async () => {
      const mockMutate = vi.fn();
      vi.mocked(useRemoveFriendModule.useRemoveFriend).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useRemoveFriendModule.useRemoveFriend>);

      const user = userEvent.setup();
      renderWithProviders();

      // Ouvrir la modale
      const removeButtons = screen.getAllByRole("button", { name: /Supprimer/i });
      await user.click(removeButtons[0]!);

      expect(
        screen.getByText("Voulez-vous vraiment supprimer Gandalf ?"),
      ).toBeInTheDocument();

      // Cliquer Supprimer dans la modale
      await user.click(screen.getByRole("button", { name: /^Supprimer$/i }));

      // La modale se ferme
      expect(
        screen.queryByText("Voulez-vous vraiment supprimer Gandalf ?"),
      ).not.toBeInTheDocument();
      // La mutation est appelée avec le bon friendshipId
      expect(mockMutate).toHaveBeenCalledWith("uuid-1");
    });

    it("UA-003: réinitialise selectedFriendId après confirmation", async () => {
      const mockMutate = vi.fn();
      vi.mocked(useRemoveFriendModule.useRemoveFriend).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useRemoveFriendModule.useRemoveFriend>);

      const user = userEvent.setup();
      renderWithProviders();

      // Ouvrir la modale sur Gandalf
      const removeButtons = screen.getAllByRole("button", { name: /Supprimer/i });
      await user.click(removeButtons[0]!);

      // Confirmer la suppression
      await user.click(screen.getByRole("button", { name: /^Supprimer$/i }));

      // Vérifier que selectedFriendId est réinitialisé (la modale est fermée)
      // et qu'on peut ouvrir une autre modale
      const otherButtons = screen.getAllByRole("button", { name: /^Supprimer$/i });
      await user.click(otherButtons[1]!); // Frodon Sacquet

      expect(
        screen.queryByText("Voulez-vous vraiment supprimer Frodon Sacquet ?"),
      ).toBeInTheDocument();
    });

    it("INV-003: les boutons sont désactivés et affichent 'Suppression...' quand isPending est true", () => {
      vi.mocked(useRemoveFriendModule.useRemoveFriend).mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
      } as unknown as ReturnType<typeof useRemoveFriendModule.useRemoveFriend>);

      renderWithProviders();

      const suppressionButtons = screen.getAllByRole("button", {
        name: /Suppression\.\.\./i,
      });
      expect(suppressionButtons.length).toBeGreaterThan(0);
      suppressionButtons.forEach((btn) => expect(btn).toBeDisabled());
    });
  });
});

// ── Matrice de couverture UA ─────────────────────────────────────────────────
// UA-001 — Ouverture de la modale de confirmation de suppression : COUVERT
//   → clic "Supprimer" → modale avec message + boutons Annuler/Supprimer
//   → selectedFriendId stocké correctement (vérifié via l'ami affiché)
// UA-002 — Fermeture par "Annuler" : COUVERT
//   → clic "Annuler" → modale fermée, mutate non appelé
// UA-003 — Confirmation de suppression avec comportement optimiste : COUVERT
//   → clic "Supprimer" → modale fermée, mutate(friendshipId) appelé
//   → selectedFriendId réinitialisé après confirmation
//   → INV-003 : isPending=true → boutons désactivés + texte "Suppression..."
// UA-004 — Toast de succès après suppression : NON COUVERT (logique dans useRemoveFriend)
// UA-005 — Toast d'échec et rollback : NON COUVERT (logique dans useRemoveFriend)