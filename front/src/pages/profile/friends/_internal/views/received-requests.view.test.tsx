import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReceivedRequestsView } from "./received-requests.view";
import type { RequestModeration } from "../hooks/use-request-moderation";
import type { QueryState } from "@/shared/types/ui-state";
import type { ReceivedRequest } from "../types/friends-schema";

const mockRequest: ReceivedRequest = {
  id: "request-uuid",
  status: "pending",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  requester: {
    displayName: "Gandalf",
  },
};

const mockRequests: ReceivedRequest[] = [mockRequest];

// ── Helpers ──────────────────────────────────────────────────────────────────

function queryState(
  overrides: Partial<QueryState<ReceivedRequest[]>> = {},
): QueryState<ReceivedRequest[]> {
  return { data: mockRequests, loading: false, error: false, ...overrides };
}

function moderationState(
  overrides: Partial<RequestModeration> = {},
): RequestModeration {
  return {
    onAccept: vi.fn(),
    onRefuse: vi.fn(),
    acceptPending: false,
    refusePending: false,
    ...overrides,
  };
}

function renderRequests(
  requests: QueryState<ReceivedRequest[]> = queryState(),
  moderation: RequestModeration = moderationState(),
) {
  return render(
    <ReceivedRequestsView requests={requests} moderation={moderation} />,
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("ReceivedRequestsView", () => {
  describe("affichage normal", () => {
    it("should display loading state when loading is true", () => {
      renderRequests(queryState({ data: [], loading: true }));

      expect(screen.getByText(/Chargement\.\.\./i)).toBeInTheDocument();
    });

    it("should display error state when error is true", () => {
      renderRequests(queryState({ data: [], error: true }));

      expect(
        screen.getByText(/Erreur lors du chargement des demandes\./i),
      ).toBeInTheDocument();
    });

    it("should display empty state when no requests and not loading/error", () => {
      renderRequests(queryState({ data: [] }));

      expect(
        screen.getByText(/Tu n'as pas de demandes en attente\./i),
      ).toBeInTheDocument();
    });

    it("should display all requests with requester displayName", () => {
      renderRequests();

      expect(screen.getByText("Gandalf")).toBeInTheDocument();
    });
  });

  describe("boutons Accepter et Refuser", () => {
    it("should display Accepter and Refuser buttons for each request", () => {
      renderRequests();

      expect(screen.getByRole("button", { name: /Accepter/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Refuser/i })).toBeInTheDocument();
    });

    it("should call onAccept with request id when Accepter clicked", async () => {
      const onAccept = vi.fn();
      renderRequests(queryState(), moderationState({ onAccept }));

      await userEvent.click(screen.getByRole("button", { name: /Accepter/i }));

      expect(onAccept).toHaveBeenCalledWith("request-uuid");
    });

    it("should call onRefuse with request id when Refuser clicked", async () => {
      const onRefuse = vi.fn();
      renderRequests(queryState(), moderationState({ onRefuse }));

      await userEvent.click(screen.getByRole("button", { name: /Refuser/i }));

      expect(onRefuse).toHaveBeenCalledWith("request-uuid");
    });

    it("should show 'Acceptation...' when acceptPending is true", () => {
      renderRequests(queryState(), moderationState({ acceptPending: true }));

      expect(
        screen.getByRole("button", { name: /Acceptation\.\.\./i }),
      ).toBeInTheDocument();
    });

    it("should show 'Refus...' when refusePending is true", () => {
      renderRequests(queryState(), moderationState({ refusePending: true }));

      expect(
        screen.getByRole("button", { name: /Refus\.\.\./i }),
      ).toBeInTheDocument();
    });

    it("should disable Accepter button when acceptPending is true", () => {
      renderRequests(queryState(), moderationState({ acceptPending: true }));

      expect(
        screen.getByRole("button", { name: /Acceptation\.\.\./i }),
      ).toBeDisabled();
    });

    it("should disable Refuser button when refusePending is true", () => {
      renderRequests(queryState(), moderationState({ refusePending: true }));

      expect(screen.getByRole("button", { name: /Refus\.\.\./i })).toBeDisabled();
    });
  });
});

// ── Matrice de couverture UA ─────────────────────────────────────────────────
// Aucune UA couverte ici : ReceivedRequestsView ne gère pas l'affichage du badge.
// Le badge est géré par ReceivedCountBadgeContainer, posé par FriendsView.
// Les tests du badge vivent dans received-count-badge.{view,container}.test.tsx.
