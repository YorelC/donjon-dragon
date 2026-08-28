import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { FriendsContainer } from "./friends.container";

// Mock modules
import * as useFriendsTabsModule from "../hooks/use-friends-tabs";
import * as useFriendsModule from "@/shared/queries/use-friends";
import * as useRemoveFriendModule from "../queries/use-remove-friend";
import * as useReceivedCountModule from "@/shared/queries/use-received-count";

vi.mock("../hooks/use-friends-tabs");
vi.mock("@/shared/queries/use-friends");
vi.mock("../queries/use-remove-friend");
vi.mock("@/shared/queries/use-received-count");

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
  const router = createMemoryRouter([
    {
      path: "*",
      element: <FriendsContainer />,
    },
  ]);

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
    queryClient,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("FriendsContainer", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Default mocks (non-removal tests can override)
    vi.mocked(useFriendsModule.useFriends).mockReturnValue({
      data: mockFriends,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useFriendsModule.useFriends>);

    vi.mocked(useRemoveFriendModule.useRemoveFriend).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useRemoveFriendModule.useRemoveFriend>);

    vi.mocked(useFriendsTabsModule.useFriendsTabs).mockReturnValue({
      activeTab: "friends",
      setActiveTab: vi.fn(),
    });

    vi.mocked(useReceivedCountModule.useReceivedCount).mockReturnValue({
      data: undefined,
    } as unknown as ReturnType<typeof useReceivedCountModule.useReceivedCount>);
  });

  // ── UA-001 à UA-005 : Modale de suppression d'ami ───────────────────────────

  describe("UA-001 à UA-005 : Modale de suppression d'ami", () => {
    it("UA-001: ouvre la modale avec le message 'Voulez-vous vraiment supprimer {displayName} ?' au clic sur Supprimer", async () => {
      const user = userEvent.setup();
      renderWithProviders();

      // Cliquer sur "Retirer" pour Gandalf
      const removeButtons = screen.getAllByRole("button", { name: /Retirer/i });
      await user.click(removeButtons[0]!);

      expect(
        screen.getByText("Voulez-vous vraiment supprimer Gandalf ?"),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Annuler/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Supprimer/i })).toBeInTheDocument();
    });

    it("UA-002: ferme la modale sans appeler la mutation quand on clique Annuler", async () => {
      const mockMutate = vi.fn();
      vi.mocked(useRemoveFriendModule.useRemoveFriend).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useRemoveFriendModule.useRemoveFriend>);

      const user = userEvent.setup();
      renderWithProviders();

      // Ouvrir la modale
      const removeButtons = screen.getAllByRole("button", { name: /Retirer/i });
      await user.click(removeButtons[0]!);

      // Vérifier que la modale est ouverte
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

    it("UA-003: ferme la modale, appelle la mutation et désactive les boutons pendant la suppression", async () => {
      const mockMutate = vi.fn();
      vi.mocked(useRemoveFriendModule.useRemoveFriend).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useRemoveFriendModule.useRemoveFriend>);

      const user = userEvent.setup();
      renderWithProviders();

      // Cliquer Supprimer sur Gandalf
      const removeButtons = screen.getAllByRole("button", { name: /Retirer/i });
      await user.click(removeButtons[0]!);

      // Vérifier la modale ouverte
      expect(
        screen.getByText("Voulez-vous vraiment supprimer Gandalf ?"),
      ).toBeInTheDocument();

      // Cliquer "Supprimer" dans la modale
      await user.click(screen.getByRole("button", { name: /^Supprimer$/i }));

      // La modale se ferme
      expect(
        screen.queryByText("Voulez-vous vraiment supprimer Gandalf ?"),
      ).not.toBeInTheDocument();

      // La mutation est appelée avec le bon friendshipId
      expect(mockMutate).toHaveBeenCalledWith("uuid-1");
    });

    it("UA-003: bouton Supprimer désactivé et affiche 'Suppression...' quand isPending est true", () => {
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

  // ── UA-008 : le compteur est demandé quel que soit l'onglet actif ───────────

  describe("UA-008 — Rechargement du count au chargement de la page", () => {
    it("interroge le compteur au montage même si l'onglet actif n'est pas 'Reçues'", () => {
      renderWithProviders();

      expect(useReceivedCountModule.useReceivedCount).toHaveBeenCalled();
    });
  });
});

// ── Matrice de couverture UA ─────────────────────────────────────────────────
// UA-001 — Ouverture de la modale de confirmation de suppression : COUVERT
//   → clic "Supprimer" → modale avec message + boutons Annuler/Supprimer
// UA-002 — Fermeture par "Annuler" : COUVERT
//   → clic "Annuler" → modale fermée, mutate non appelé
// UA-003 — Confirmation de suppression avec comportement optimiste : COUVERT
//   → clic "Supprimer" → modale fermée, mutate(friendshipId) appelé
//   → isPending=true → boutons désactivés + texte "Suppression..."
// UA-004 — Toast de succès après suppression : NON COUVERT (logique dans useRemoveFriend)
//   → testé dans use-remove-friend.test.tsx
// UA-005 — Toast d'échec et rollback : NON COUVERT (logique dans useRemoveFriend)
//   → testé dans use-remove-friend.test.tsx
// UA-008 — Rechargement du count au chargement de la page : COUVERT
//   → le badge est monté dans la liste d'onglets, donc interrogé quel que soit
//     l'onglet actif
// UA-006 / UA-007 / INV-008 — badge : shared/components/molecules/count-badge.test.tsx
// UA-010 / INV-007 — masquage à zéro : received-count-badge.container.test.tsx
// UA-009 — rafraîchissement au clic sur "Reçues" : use-friends-tabs.test.ts
