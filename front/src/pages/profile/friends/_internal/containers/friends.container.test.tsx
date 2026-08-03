import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { FriendsContainer } from "./friends.container";

// Mock modules
import * as useFriendsTabsModule from "../hooks/use-friends-tabs";
import * as useReceivedRequestsModule from "../queries/use-received-requests";
import * as useFriendsModule from "../queries/use-friends";
import * as useRemoveFriendModule from "../queries/use-remove-friend";
import * as useReceivedCountModule from "../queries/use-received-count";

vi.mock("../hooks/use-friends-tabs");
vi.mock("../queries/use-received-requests");
vi.mock("../queries/use-friends");
vi.mock("../queries/use-remove-friend");
vi.mock("../queries/use-received-count");

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockFriend = (friendshipId: string, displayName: string) => ({
  friendshipId,
  friend: {
    id: `user-${friendshipId}`,
    email: `${displayName.toLowerCase()}@example.com`,
    displayName,
    createdAt: "2025-01-01T00:00:00Z",
    emailVerified: true,
  },
});

const mockRequest = (id: string, displayName: string) => ({
  id,
  requesterId: `user-${id}`,
  recipientId: "me",
  status: "pending" as const,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  requester: {
    id: `user-${id}`,
    email: `${displayName.toLowerCase()}@example.com`,
    displayName,
    createdAt: "2025-01-01T00:00:00Z",
    emailVerified: true,
  },
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

    vi.mocked(useReceivedRequestsModule.useReceivedRequests).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useReceivedRequestsModule.useReceivedRequests>);

    vi.mocked(useFriendsTabsModule.useFriendsTabs).mockReturnValue({
      activeTab: "friends",
      setActiveTab: vi.fn(),
    });

    vi.mocked(useReceivedCountModule.useReceivedCount).mockReturnValue({
      data: undefined,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useReceivedCountModule.useReceivedCount>);
  });

  // ── UA-001 à UA-005 : Modale de suppression d'ami ───────────────────────────

  describe("UA-001 à UA-005 : Modale de suppression d'ami", () => {
    it("UA-001: ouvre la modale avec le message 'Voulez-vous vraiment supprimer {displayName} ?' au clic sur Supprimer", async () => {
      const user = userEvent.setup();
      renderWithProviders();

      // Cliquer sur "Supprimer" pour Gandalf
      const removeButtons = screen.getAllByRole("button", { name: /Supprimer/i });
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
      const removeButtons = screen.getAllByRole("button", { name: /Supprimer/i });
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
      const removeButtons = screen.getAllByRole("button", { name: /Supprimer/i });
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

  // ── UA-006 à UA-010 : Badge compteur de demandes reçues ────────────────────

  describe("UA-006 à UA-010 : Badge compteur de demandes reçues", () => {
    beforeEach(() => {
      vi.mocked(useFriendsModule.useFriends).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
      } as unknown as ReturnType<typeof useFriendsModule.useFriends>);
    });

    describe("UA-006 — Affichage du badge pour count > 0", () => {
      it.each([
        { count: 1, label: "1" },
        { count: 3, label: "3" },
        { count: 9, label: "9" },
      ])(
        "UA-006: affiche le badge '$label' pour $count demande(s) reçue(s)",
        ({ count, label }) => {
          vi.mocked(
            useReceivedCountModule.useReceivedCount,
          ).mockReturnValue({
            data: { count },
            refetch: vi.fn(),
          } as unknown as ReturnType<typeof useReceivedCountModule.useReceivedCount>);

          renderWithProviders();

          expect(screen.getByText(label)).toBeInTheDocument();
        },
      );
    });

    describe("UA-007 — Truncation du badge à '9+'", () => {
      it.each([
        { count: 10, label: "9+" },
        { count: 15, label: "9+" },
        { count: 99, label: "9+" },
      ])(
        "UA-007: affiche '$label' pour $count demandes reçues",
        ({ count, label }) => {
          vi.mocked(
            useReceivedCountModule.useReceivedCount,
          ).mockReturnValue({
            data: { count },
            refetch: vi.fn(),
          } as unknown as ReturnType<typeof useReceivedCountModule.useReceivedCount>);

          renderWithProviders();

          expect(screen.getByText(label)).toBeInTheDocument();
        },
      );
    });

    describe("UA-008 — Rechargement du count au chargement de la page", () => {
      it("UA-008: appelle useReceivedCount lors du montage quel que soit l'onglet actif", () => {
        vi.mocked(useFriendsTabsModule.useFriendsTabs).mockReturnValue({
          activeTab: "friends",
          setActiveTab: vi.fn(),
        });

        const useReceivedCountSpy = vi.fn();
        vi.mocked(
          useReceivedCountModule.useReceivedCount,
        ).mockImplementation(() => {
          useReceivedCountSpy();
          return {
            data: undefined,
            refetch: vi.fn(),
          } as unknown as ReturnType<typeof useReceivedCountModule.useReceivedCount>;
        });

        renderWithProviders();

        // La query doit avoir été appelée pendant le rendu
        expect(useReceivedCountSpy).toHaveBeenCalled();
      });
    });

    describe("UA-009 — Rafraîchissement du count au clic sur l'onglet 'Reçues'", () => {
      it("UA-009: appelle refetch quand on clique sur l'onglet 'Reçues'", async () => {
        const mockRefetch = vi.fn();
        vi.mocked(
          useReceivedCountModule.useReceivedCount,
        ).mockReturnValue({
          data: { count: 5 },
          refetch: mockRefetch,
        } as unknown as ReturnType<typeof useReceivedCountModule.useReceivedCount>);

        const mockSetActiveTab = vi.fn();
        vi.mocked(useFriendsTabsModule.useFriendsTabs).mockReturnValue({
          activeTab: "friends",
          setActiveTab: mockSetActiveTab,
        });

        const user = userEvent.setup();
        renderWithProviders();

        // Clic sur l'onglet "Reçues"
        const receivedTab = screen.getByText("Reçues");
        await user.click(receivedTab);

        // Le refetch doit être appelé (dans onTabChange)
        expect(mockRefetch).toHaveBeenCalled();
      });
    });

    describe("UA-010 — Masquage du badge à zéro demande", () => {
      it("UA-010: n'affiche aucun badge quand count est 0", () => {
        vi.mocked(
          useReceivedCountModule.useReceivedCount,
        ).mockReturnValue({
          data: { count: 0 },
          refetch: vi.fn(),
        } as unknown as ReturnType<typeof useReceivedCountModule.useReceivedCount>);

        renderWithProviders();

        expect(screen.queryByText(/^[0-9]+$/)).not.toBeInTheDocument();
        expect(screen.queryByText("9+")).not.toBeInTheDocument();
      });

      it("UA-010: n'affiche aucun badge quand le count n'est pas encore chargé (data undefined)", () => {
        vi.mocked(
          useReceivedCountModule.useReceivedCount,
        ).mockReturnValue({
          data: undefined,
          refetch: vi.fn(),
        } as unknown as ReturnType<typeof useReceivedCountModule.useReceivedCount>);

        renderWithProviders();

        expect(screen.queryByText(/^[0-9]+$/)).not.toBeInTheDocument();
        expect(screen.queryByText("9+")).not.toBeInTheDocument();
      });
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
// UA-004 — Toast de succès après suppression : NON COUVERT (logique dans useRemoveFriend, pas dans FriendsContainer)
//   → testé dans use-remove-friend.test.ts
// UA-005 — Toast d'échec et rollback : NON COUVERT (logique dans useRemoveFriend, pas dans FriendsContainer)
//   → testé dans use-remove-friend.test.ts
// UA-006 — Affichage du badge de demandes sur l'onglet "Reçues" : COUVERT
//   → table-driven via useReceivedCount mock : 1, 3, 9
// UA-007 — Truncation du badge à "9+" : COUVERT
//   → table-driven via useReceivedCount mock : 10, 15, 99
// UA-008 — Rechargement du count au chargement de la page : COUVERT
//   → useReceivedCount appelée au montage, même avec onglet "friends" actif
// UA-009 — Rafraîchissement du count au clic sur l'onglet "Reçues" : COUVERT
//   → refetch appelé lors du clic sur l'onglet "Reçues"
// UA-010 — Masquage du badge à zéro demande : COUVERT
//   → aucun badge affiché quand count === 0
//   → aucun badge affiché quand data === undefined (pas encore chargé)
//
// UA-004 et UA-005 nécessitent un test de la mutation useRemoveFriend
// (comportement onSuccess/onError avec toast et rollback) — voir use-remove-friend.test.tsx