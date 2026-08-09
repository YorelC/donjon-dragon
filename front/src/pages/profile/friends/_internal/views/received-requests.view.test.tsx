import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReceivedRequestsView } from "./received-requests.view";
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

describe("ReceivedRequestsView", () => {
  describe("affichage normal", () => {
    it("should display loading state when loading is true", () => {
      render(
        <ReceivedRequestsView
          requests={[]}
          loading={true}
          error={false}
          onAccept={vi.fn()}
          onRefuse={vi.fn()}
          acceptMutationPending={false}
          refuseMutationPending={false}
        />
      );

      expect(screen.getByText(/Chargement\.\.\./i)).toBeInTheDocument();
    });

    it("should display error state when error is true", () => {
      render(
        <ReceivedRequestsView
          requests={[]}
          loading={false}
          error={true}
          onAccept={vi.fn()}
          onRefuse={vi.fn()}
          acceptMutationPending={false}
          refuseMutationPending={false}
        />
      );

      expect(
        screen.getByText(/Erreur lors du chargement des demandes\./i)
      ).toBeInTheDocument();
    });

    it("should display empty state when no requests and not loading/error", () => {
      render(
        <ReceivedRequestsView
          requests={[]}
          loading={false}
          error={false}
          onAccept={vi.fn()}
          onRefuse={vi.fn()}
          acceptMutationPending={false}
          refuseMutationPending={false}
        />
      );

      expect(
        screen.getByText(/Tu n'as pas de demandes en attente\./i)
      ).toBeInTheDocument();
    });

    it("should display all requests with requester displayName", () => {
      render(
        <ReceivedRequestsView
          requests={mockRequests}
          loading={false}
          error={false}
          onAccept={vi.fn()}
          onRefuse={vi.fn()}
          acceptMutationPending={false}
          refuseMutationPending={false}
        />
      );

      expect(screen.getByText("Gandalf")).toBeInTheDocument();
    });
  });

  describe("boutons Accepter et Refuser", () => {
    it("should display Accepter and Refuser buttons for each request", () => {
      render(
        <ReceivedRequestsView
          requests={mockRequests}
          loading={false}
          error={false}
          onAccept={vi.fn()}
          onRefuse={vi.fn()}
          acceptMutationPending={false}
          refuseMutationPending={false}
        />
      );

      expect(screen.getByRole("button", { name: /Accepter/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Refuser/i })).toBeInTheDocument();
    });

    it("should call onAccept with request id when Accepter clicked", async () => {
      const onAccept = vi.fn();
      render(
        <ReceivedRequestsView
          requests={mockRequests}
          loading={false}
          error={false}
          onAccept={onAccept}
          onRefuse={vi.fn()}
          acceptMutationPending={false}
          refuseMutationPending={false}
        />
      );

      const button = screen.getByRole("button", { name: /Accepter/i });
      await userEvent.click(button);

      expect(onAccept).toHaveBeenCalledWith("request-uuid");
    });

    it("should call onRefuse with request id when Refuser clicked", async () => {
      const onRefuse = vi.fn();
      render(
        <ReceivedRequestsView
          requests={mockRequests}
          loading={false}
          error={false}
          onAccept={vi.fn()}
          onRefuse={onRefuse}
          acceptMutationPending={false}
          refuseMutationPending={false}
        />
      );

      const button = screen.getByRole("button", { name: /Refuser/i });
      await userEvent.click(button);

      expect(onRefuse).toHaveBeenCalledWith("request-uuid");
    });

    it("should show 'Acceptation...' when acceptMutationPending is true", () => {
      render(
        <ReceivedRequestsView
          requests={mockRequests}
          loading={false}
          error={false}
          onAccept={vi.fn()}
          onRefuse={vi.fn()}
          acceptMutationPending={true}
          refuseMutationPending={false}
        />
      );

      expect(screen.getByRole("button", { name: /Acceptation\.\.\./i })).toBeInTheDocument();
    });

    it("should show 'Refus...' when refuseMutationPending is true", () => {
      render(
        <ReceivedRequestsView
          requests={mockRequests}
          loading={false}
          error={false}
          onAccept={vi.fn()}
          onRefuse={vi.fn()}
          acceptMutationPending={false}
          refuseMutationPending={true}
        />
      );

      expect(screen.getByRole("button", { name: /Refus\.\.\./i })).toBeInTheDocument();
    });

    it("should disable Accepter button when acceptMutationPending is true", () => {
      const onAccept = vi.fn();
      render(
        <ReceivedRequestsView
          requests={mockRequests}
          loading={false}
          error={false}
          onAccept={onAccept}
          onRefuse={vi.fn()}
          acceptMutationPending={true}
          refuseMutationPending={false}
        />
      );

      const button = screen.getByRole("button", { name: /Acceptation\.\.\./i });
      expect(button).toBeDisabled();
    });

    it("should disable Refuser button when refuseMutationPending is true", () => {
      const onRefuse = vi.fn();
      render(
        <ReceivedRequestsView
          requests={mockRequests}
          loading={false}
          error={false}
          onAccept={vi.fn()}
          onRefuse={onRefuse}
          acceptMutationPending={false}
          refuseMutationPending={true}
        />
      );

      const button = screen.getByRole("button", { name: /Refus\.\.\./i });
      expect(button).toBeDisabled();
    });
  });
});

// ── Matrice de couverture UA ─────────────────────────────────────────────────
// Aucune UA couverte ici : ReceivedRequestsView ne gère pas l'affichage du badge.
// Le badge est géré par FriendsView/FriendsTabsList dans FriendsContainer.
// Les tests pour le badge doivent être écrits dans friends.view.test.tsx ou friends.container.test.tsx.
