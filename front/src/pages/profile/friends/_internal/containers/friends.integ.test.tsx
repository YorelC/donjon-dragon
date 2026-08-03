/**
 * INTEG — Tests d'intégration (jointure) pour le parcours complet :
 * suppression d'ami avec confirmation + badge compteur de demandes reçues.
 *
 * Principe : on mocke fetch (la couche I/O), les hooks TanStack Query
 * tournent pour de vrai. On teste l'ASSEMBLAGE réel entre Container,
 * hooks, API layer, et vues.
 *
 * Référence : specs/003-friends-list-modal-badge.md — Parcours nominal (Gherkin)
 * Feature: Suppression d'un ami avec confirmation
 * Feature: Badge de demandes en attente
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { FriendsContainer } from "./friends.container";
import { Toaster } from "@/shared/components/atoms/sonner";

// ── Types ──────────────────────────────────────────────────────────────────

/** Call-count-aware fetch mock. Chaque appel incrémente un compteur par URL. */
type FetchResponse = { status: number; body: unknown };
type FetchHandler = (url: string, method: string, callIndex: number) => FetchResponse;

// ── Fixtures ───────────────────────────────────────────────────────────────

const FRIENDS = [
  {
    friendshipId: "uuid-gandalf",
    friend: {
      id: "user-gandalf",
      email: "gandalf@example.com",
      displayName: "Gandalf",
      createdAt: "2025-01-01T00:00:00Z",
      emailVerified: true,
    },
  },
  {
    friendshipId: "uuid-frodon",
    friend: {
      id: "user-frodon",
      email: "frodon@example.com",
      displayName: "Frodon Sacquet",
      createdAt: "2025-01-02T00:00:00Z",
      emailVerified: true,
    },
  },
  {
    friendshipId: "uuid-aragorn",
    friend: {
      id: "user-aragorn",
      email: "aragorn@example.com",
      displayName: "Aragorn",
      createdAt: "2025-01-03T00:00:00Z",
      emailVerified: true,
    },
  },
];

const REQUESTS_3 = [
  {
    id: "req-1",
    requesterId: "user-requester-1",
    recipientId: "me",
    status: "pending" as const,
    createdAt: "2025-01-05T00:00:00Z",
    updatedAt: "2025-01-05T00:00:00Z",
    requester: {
      id: "user-requester-1",
      email: "user1@example.com",
      displayName: "User 1",
      createdAt: "2025-01-01T00:00:00Z",
      emailVerified: true,
    },
  },
  {
    id: "req-2",
    requesterId: "user-requester-2",
    recipientId: "me",
    status: "pending" as const,
    createdAt: "2025-01-06T00:00:00Z",
    updatedAt: "2025-01-06T00:00:00Z",
    requester: {
      id: "user-requester-2",
      email: "user2@example.com",
      displayName: "User 2",
      createdAt: "2025-01-01T00:00:00Z",
      emailVerified: true,
    },
  },
  {
    id: "req-3",
    requesterId: "user-requester-3",
    recipientId: "me",
    status: "pending" as const,
    createdAt: "2025-01-07T00:00:00Z",
    updatedAt: "2025-01-07T00:00:00Z",
    requester: {
      id: "user-requester-3",
      email: "user3@example.com",
      displayName: "User 3",
      createdAt: "2025-01-01T00:00:00Z",
      emailVerified: true,
    },
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

let fetchSpy: ReturnType<typeof vi.spyOn> | undefined;
let callCounts: Record<string, number>;

function setupFetchMock(handler: FetchHandler) {
  callCounts = {};
  fetchSpy = vi
    .spyOn(global, "fetch")
    .mockImplementation(
      async (url: RequestInfo | URL, options?: RequestInit) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        const method = options?.method ?? "GET";
        const key = `${method} ${urlStr}`;
        callCounts[key] = (callCounts[key] ?? 0) + 1;
        const index = callCounts[key] - 1;

        const result = handler(urlStr, method, index);

        const body =
          result.body !== undefined ? JSON.stringify(result.body) : undefined;
        return new Response(body, {
          status: result.status,
          headers: { "Content-Type": "application/json" },
        });
      },
    ) as unknown as ReturnType<typeof vi.spyOn>;
}

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const router = createMemoryRouter([
    {
      path: "*",
      element: (
        <>
          <FriendsContainer />
          <Toaster />
        </>
      ),
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

// ── Tests ──────────────────────────────────────────────────────────────────

describe("[INTEG] Parcours complet : suppression ami et badge", () => {
  beforeAll(() => {
    // sonner Toaster utilise window.matchMedia (prefers-color-scheme) au montage
    // jsdom ne le fournit pas : on le mocke.
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  // ── Feature: Suppression d'un ami avec confirmation ─────────────────────

  describe("Feature: Suppression d'un ami avec confirmation", () => {
    beforeEach(() => {
      setupFetchMock((url, method) => {
        if (method === "GET" && url === "/api/friends") {
          return { status: 200, body: FRIENDS };
        }
        if (method === "GET" && url === "/api/friends/requests/incoming") {
          return { status: 200, body: [] };
        }
        if (method === "GET" && url === "/api/friends/requests/incoming/count") {
          return { status: 200, body: { count: 0 } };
        }
        if (method === "DELETE" && url.startsWith("/api/friends/")) {
          return { status: 204, body: undefined };
        }
        return { status: 404, body: { error: "not mocked" } };
      });
    });

    it("INTEG-001: parcours nominal — suppression complète d'un ami (Gandalf)", async () => {
      const user = userEvent.setup();
      renderWithProviders();

      // 1. La liste d'amis est affichée
      await waitFor(() => {
        expect(screen.getByText("Gandalf")).toBeInTheDocument();
      });
      expect(screen.getByText("Frodon Sacquet")).toBeInTheDocument();
      expect(screen.getByText("Aragorn")).toBeInTheDocument();

      // 2. Clic "Supprimer" sur Gandalf → modale s'ouvre
      const removeButtons = screen.getAllByRole("button", { name: /Supprimer/i });
      await user.click(removeButtons[0]!);

      expect(
        screen.getByText("Voulez-vous vraiment supprimer Gandalf ?"),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Annuler/i })).toBeInTheDocument();
      const confirmButton = screen.getByRole("button", { name: /^Supprimer$/i });
      expect(confirmButton).toBeInTheDocument();

      // 3. Clic "Supprimer" dans la modale → modale fermée, DELETE appelé
      await user.click(confirmButton);

      await waitFor(() => {
        expect(
          screen.queryByText("Voulez-vous vraiment supprimer Gandalf ?"),
        ).not.toBeInTheDocument();
      });

      // 4. Vérifier que DELETE a été appelé
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/friends/uuid-gandalf",
        expect.objectContaining({ method: "DELETE" }),
      );

      // 5. Toast de succès apparaît
      await waitFor(
        () => {
          expect(screen.getByText("Ami supprimé")).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it("INTEG-002: annulation — clic Annuler ferme la modale sans appel API", async () => {
      const user = userEvent.setup();
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText("Gandalf")).toBeInTheDocument();
      });

      // Ouvrir la modale
      const removeButtons = screen.getAllByRole("button", { name: /Supprimer/i });
      await user.click(removeButtons[0]!);

      expect(
        screen.getByText("Voulez-vous vraiment supprimer Gandalf ?"),
      ).toBeInTheDocument();

      // Cliquer Annuler
      await user.click(screen.getByRole("button", { name: /Annuler/i }));

      // Modale fermée
      await waitFor(() => {
        expect(
          screen.queryByText("Voulez-vous vraiment supprimer Gandalf ?"),
        ).not.toBeInTheDocument();
      });

      // Aucun DELETE n'a été appelé
      const deleteCalls = fetchSpy!.mock.calls.filter(
        ([, opts]) => (opts as RequestInit)?.method === "DELETE",
      );
      expect(deleteCalls).toHaveLength(0);
    });

    it("INTEG-003: suppression avec isPending — bouton 'Suppression...' désactivé après clic sur Supprimer dans la modale", async () => {
      // On retarde la réponse DELETE pour voir l'état isPending
      let resolveDelete: (() => void) | null = null;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });

      fetchSpy?.mockRestore();
      fetchSpy = vi
        .spyOn(global, "fetch")
        .mockImplementation(
          async (url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = typeof url === "string" ? url : url.toString();
            const method = options?.method ?? "GET";

            if (method === "GET" && urlStr === "/api/friends") {
              return new Response(JSON.stringify(FRIENDS), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (method === "GET" && urlStr === "/api/friends/requests/incoming") {
              return new Response(JSON.stringify([]), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (method === "GET" && urlStr === "/api/friends/requests/incoming/count") {
              return new Response(JSON.stringify({ count: 0 }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (method === "DELETE" && urlStr.startsWith("/api/friends/")) {
              await deletePromise;
              return new Response(null, { status: 204 });
            }
            return new Response(JSON.stringify({ error: "not mocked" }), {
              status: 404,
            });
          },
        ) as unknown as ReturnType<typeof vi.spyOn>;

      const user = userEvent.setup();
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText("Gandalf")).toBeInTheDocument();
      });

      // Ouvrir la modale, cliquer Supprimer
      const removeButtons = screen.getAllByRole("button", { name: /Supprimer/i });
      await user.click(removeButtons[0]!);

      const confirmButton = screen.getByRole("button", { name: /^Supprimer$/i });
      await user.click(confirmButton);

      // Les boutons de la liste affichent "Suppression..." et sont désactivés
      const suppressionButtons = screen.getAllByRole("button", {
        name: /Suppression\.\.\./i,
      });
      expect(suppressionButtons.length).toBeGreaterThan(0);
      suppressionButtons.forEach((btn) => expect(btn).toBeDisabled());

      // Libérer la requête DELETE
      resolveDelete!();
    });

    it("INTEG-004: échec API — toast d'erreur et rollback (Gandalf réapparaît)", async () => {
      // On commence avec la liste normale, puis le DELETE échoue
      let deleteCalled = false;

      fetchSpy?.mockRestore();
      fetchSpy = vi
        .spyOn(global, "fetch")
        .mockImplementation(
          async (url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = typeof url === "string" ? url : url.toString();
            const method = options?.method ?? "GET";

            if (method === "GET" && urlStr === "/api/friends") {
              return new Response(JSON.stringify(FRIENDS), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (method === "GET" && urlStr === "/api/friends/requests/incoming") {
              return new Response(JSON.stringify([]), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (method === "GET" && urlStr === "/api/friends/requests/incoming/count") {
              return new Response(JSON.stringify({ count: 0 }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (method === "DELETE" && urlStr.startsWith("/api/friends/")) {
              deleteCalled = true;
              // Simuler une erreur serveur
              return new Response(JSON.stringify({ error: "Server error" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
              });
            }
            return new Response(JSON.stringify({ error: "not mocked" }), {
              status: 404,
            });
          },
        ) as unknown as ReturnType<typeof vi.spyOn>;

      const user = userEvent.setup();
      renderWithProviders();

      // Attendre que la liste soit chargée
      await waitFor(() => {
        expect(screen.getByText("Gandalf")).toBeInTheDocument();
      });

      // Ouvrir la modale → confirmer
      const removeButtons = screen.getAllByRole("button", { name: /Supprimer/i });
      await user.click(removeButtons[0]!);

      await user.click(screen.getByRole("button", { name: /^Supprimer$/i }));

      // Attendre que le DELETE soit appelé
      await waitFor(() => {
        expect(deleteCalled).toBe(true);
      });

      // Toast d'erreur apparaît
      await waitFor(
        () => {
          expect(
            screen.getByText(
              "Erreur lors de la suppression. Veuillez réessayer.",
            ),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Gandalf est toujours dans la liste (rollback optimiste)
      expect(screen.getByText("Gandalf")).toBeInTheDocument();
      expect(screen.getByText("Frodon Sacquet")).toBeInTheDocument();
      expect(screen.getByText("Aragorn")).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /Supprimer/i })).toHaveLength(
        3,
      );
    });

    it("INTEG-009: suppression optimiste — Gandalf disparaît de la liste avant la réponse API", async () => {
      // On retarde la réponse DELETE pour vérifier l'optimistic update
      let resolveDelete: (() => void) | null = null;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });

      fetchSpy?.mockRestore();
      fetchSpy = vi
        .spyOn(global, "fetch")
        .mockImplementation(
          async (url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = typeof url === "string" ? url : url.toString();
            const method = options?.method ?? "GET";

            if (method === "GET" && urlStr === "/api/friends") {
              return new Response(JSON.stringify(FRIENDS), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (method === "GET" && urlStr === "/api/friends/requests/incoming") {
              return new Response(JSON.stringify([]), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (method === "GET" && urlStr === "/api/friends/requests/incoming/count") {
              return new Response(JSON.stringify({ count: 0 }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (method === "DELETE" && urlStr.startsWith("/api/friends/")) {
              await deletePromise;
              return new Response(null, { status: 204 });
            }
            return new Response(JSON.stringify({ error: "not mocked" }), {
              status: 404,
            });
          },
        ) as unknown as ReturnType<typeof vi.spyOn>;

      const user = userEvent.setup();
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText("Gandalf")).toBeInTheDocument();
      });

      // Ouvrir la modale sur Gandalf
      const removeButtons = screen.getAllByRole("button", { name: /Supprimer/i });
      await user.click(removeButtons[0]!);

      expect(
        screen.getByText("Voulez-vous vraiment supprimer Gandalf ?"),
      ).toBeInTheDocument();

      // Clic "Supprimer" dans la modale
      await user.click(screen.getByRole("button", { name: /^Supprimer$/i }));

      // La modale se ferme immédiatement
      await waitFor(() => {
        expect(
          screen.queryByText("Voulez-vous vraiment supprimer Gandalf ?"),
        ).not.toBeInTheDocument();
      });

      // Gandalf disparaît de la liste (effet optimiste avant la réponse DELETE)
      expect(screen.queryByText("Gandalf")).not.toBeInTheDocument();

      // Frodon et Aragorn sont toujours là
      expect(screen.getByText("Frodon Sacquet")).toBeInTheDocument();
      expect(screen.getByText("Aragorn")).toBeInTheDocument();

      // Les boutons affichent "Suppression..." (isPending)
      const suppressionButtons = screen.getAllByRole("button", {
        name: /Suppression\.\.\./i,
      });
      expect(suppressionButtons.length).toBeGreaterThan(0);
      suppressionButtons.forEach((btn) => expect(btn).toBeDisabled());

      // Vérifier que l'appel DELETE a bien été initié
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/friends/uuid-gandalf",
        expect.objectContaining({ method: "DELETE" }),
      );

      // Libérer la requête DELETE pour que le test se termine proprement
      resolveDelete!();
    });

    it("INTEG-010: rollback API — Gandalf réapparaît à sa position précédente (première)", async () => {
      let deleteCalled = false;

      fetchSpy?.mockRestore();
      fetchSpy = vi
        .spyOn(global, "fetch")
        .mockImplementation(
          async (url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = typeof url === "string" ? url : url.toString();
            const method = options?.method ?? "GET";

            if (method === "GET" && urlStr === "/api/friends") {
              return new Response(JSON.stringify(FRIENDS), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (method === "GET" && urlStr === "/api/friends/requests/incoming") {
              return new Response(JSON.stringify([]), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (method === "GET" && urlStr === "/api/friends/requests/incoming/count") {
              return new Response(JSON.stringify({ count: 0 }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (method === "DELETE" && urlStr.startsWith("/api/friends/")) {
              deleteCalled = true;
              return new Response(JSON.stringify({ error: "Server error" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
              });
            }
            return new Response(JSON.stringify({ error: "not mocked" }), {
              status: 404,
            });
          },
        ) as unknown as ReturnType<typeof vi.spyOn>;

      const user = userEvent.setup();
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText("Gandalf")).toBeInTheDocument();
      });

      // Ouvrir la modale → confirmer
      const removeButtons = screen.getAllByRole("button", { name: /Supprimer/i });
      await user.click(removeButtons[0]!);
      await user.click(screen.getByRole("button", { name: /^Supprimer$/i }));

      // Attendre que le DELETE soit appelé
      await waitFor(() => {
        expect(deleteCalled).toBe(true);
      });

      // Attendre le toast d'erreur (rollback effectué)
      await waitFor(
        () => {
          expect(
            screen.getByText("Erreur lors de la suppression. Veuillez réessayer."),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Vérifier l'ordre des amis dans la liste : Gandalf, Frodon, Aragorn
      const friendCards = screen.getAllByText(/Gandalf|Frodon Sacquet|Aragorn/);
      expect(friendCards).toHaveLength(3);
      expect(friendCards[0]).toHaveTextContent("Gandalf");
      expect(friendCards[1]).toHaveTextContent("Frodon Sacquet");
      expect(friendCards[2]).toHaveTextContent("Aragorn");

      // Chacun a son propre bouton Supprimer
      expect(screen.getAllByRole("button", { name: /Supprimer/i })).toHaveLength(
        3,
      );
    });
  });

  // ── Feature: Badge de demandes en attente ────────────────────────────────

  describe("Feature: Badge de demandes en attente", () => {
    it("INTEG-005: badge '3' affiché à côté de 'Reçues' quand 3 demandes reçues", async () => {
      setupFetchMock((url, method) => {
        if (method === "GET" && url === "/api/friends") {
          return { status: 200, body: [] };
        }
        if (method === "GET" && url === "/api/friends/requests/incoming") {
          return { status: 200, body: REQUESTS_3 };
        }
        if (method === "GET" && url === "/api/friends/requests/incoming/count") {
          return { status: 200, body: { count: 3 } };
        }
        return { status: 404, body: { error: "not mocked" } };
      });

      renderWithProviders();

      // Le badge "3" doit être visible à côté de l'onglet "Reçues"
      await waitFor(() => {
        expect(screen.getByText("3")).toBeInTheDocument();
      });

      // Vérifier que le badge est à l'intérieur du TabsTrigger "Reçues"
      const receivedTrigger = screen.getByText("Reçues").closest("button");
      expect(receivedTrigger).toBeInTheDocument();
      const badge = within(receivedTrigger!).getByText("3");
      expect(badge).toBeInTheDocument();
    });

    it("INTEG-006: badge '9+' affiché pour 15 demandes reçues (truncation)", async () => {
      const fifteenRequests = Array.from({ length: 15 }, (_, i) => ({
        id: `req-${i}`,
        requesterId: `user-${i}`,
        recipientId: "me",
        status: "pending" as const,
        createdAt: "2025-01-05T00:00:00Z",
        updatedAt: "2025-01-05T00:00:00Z",
        requester: {
          id: `user-${i}`,
          email: `user${i}@example.com`,
          displayName: `User ${i}`,
          createdAt: "2025-01-01T00:00:00Z",
          emailVerified: true,
        },
      }));

      setupFetchMock((url, method) => {
        if (method === "GET" && url === "/api/friends") {
          return { status: 200, body: [] };
        }
        if (method === "GET" && url === "/api/friends/requests/incoming") {
          return { status: 200, body: fifteenRequests };
        }
        if (method === "GET" && url === "/api/friends/requests/incoming/count") {
          return { status: 200, body: { count: 15 } };
        }
        return { status: 404, body: { error: "not mocked" } };
      });

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText("9+")).toBeInTheDocument();
      });
    });

    it("INTEG-007: pas de badge affiché quand 0 demande reçue", async () => {
      setupFetchMock((url, method) => {
        if (method === "GET" && url === "/api/friends") {
          return { status: 200, body: [] };
        }
        if (method === "GET" && url === "/api/friends/requests/incoming") {
          return { status: 200, body: [] };
        }
        if (method === "GET" && url === "/api/friends/requests/incoming/count") {
          return { status: 200, body: { count: 0 } };
        }
        return { status: 404, body: { error: "not mocked" } };
      });

      renderWithProviders();

      // Aucun badge numérique ne doit être visible
      await waitFor(() => {
        expect(screen.queryByText(/^[0-9]+$/)).not.toBeInTheDocument();
        expect(screen.queryByText("9+")).not.toBeInTheDocument();
      });
    });

    it("INTEG-008: refetch au clic sur l'onglet 'Reçues' — le badge se met à jour", async () => {
      // Premier appel : 3 demandes. Deuxième appel (refetch) : 1 demande.
      let incomingCallCount = 0;
      let countCallCount = 0;

      fetchSpy = vi
        .spyOn(global, "fetch")
        .mockImplementation(
          async (url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = typeof url === "string" ? url : url.toString();
            const method = options?.method ?? "GET";

            if (method === "GET" && urlStr === "/api/friends") {
              return new Response(JSON.stringify([]), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (method === "GET" && urlStr === "/api/friends/requests/incoming") {
              incomingCallCount++;
              const body =
                incomingCallCount === 1 ? REQUESTS_3 : REQUESTS_3.slice(0, 1);
              return new Response(JSON.stringify(body), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (method === "GET" && urlStr === "/api/friends/requests/incoming/count") {
              countCallCount++;
              const body = countCallCount === 1 ? { count: 3 } : { count: 1 };
              return new Response(JSON.stringify(body), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
            return new Response(JSON.stringify({ error: "not mocked" }), {
              status: 404,
            });
          },
        ) as unknown as ReturnType<typeof vi.spyOn>;

      const user = userEvent.setup();
      renderWithProviders();

      // Au chargement : badge "3"
      await waitFor(() => {
        expect(screen.getByText("3")).toBeInTheDocument();
      });

      // Cliquer sur l'onglet "Reçues"
      const receivedTab = screen.getByText("Reçues");
      await user.click(receivedTab);

      // Le refetch est déclenché → le badge se met à jour (1 demande restante)
      await waitFor(() => {
        expect(countCallCount).toBeGreaterThanOrEqual(2);
      });

      // Après refetch, le badge passe à "1"
      await waitFor(() => {
        expect(screen.getByText("1")).toBeInTheDocument();
      });
    });
  });
});

// ── Matrice de couverture - Parcours Gherkin ───────────────────────────────
// Feature: Suppression d'un ami avec confirmation
//  ✓ Parcours nominal complet (INTEG-001)
//  ✓ Annulation sans appel API (INTEG-002)
//  ✓ État isPending / bouton désactivé (INTEG-003)
//  ✓ Échec API + toast d'erreur + rollback (INTEG-004)
//  ✓ Disparition optimiste avant réponse API (INTEG-009)
//  ✓ Rollback préserve la position dans la liste (INTEG-010)
//
// Feature: Badge de demandes en attente
//  ✓ Badge "3" pour 3 demandes (INTEG-005)
//  ✓ Truncation "9+" pour 15 demandes (INTEG-006)
//  ✓ Pas de badge pour 0 demande (INTEG-007)
//  ✓ Refetch au clic + mise à jour du badge (INTEG-008)
//
// Pas couvert (hors périmètre INTEG) :
//  - UA-008 (rechargement au montage) : testé unitairement dans friends.container.test.tsx
//  - Détail de l'optimistic update sur le cache uniquement : testé via use-remove-friend
//  - Les tests e2e Playwright couvriront le rendu réel avec backend