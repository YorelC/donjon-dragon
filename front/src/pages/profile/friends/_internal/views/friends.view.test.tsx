import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FriendsView } from "./friends.view";
import * as useReceivedCountModule from "@/shared/queries/use-received-count";
import * as useFriendsModule from "@/shared/queries/use-friends";
import * as useReceivedRequestsModule from "../queries/use-received-requests";
import * as useSentRequestsModule from "../queries/use-sent-requests";
import * as useSearchUsersModule from "../queries/use-search-users";
import * as useRemoveFriendModule from "../queries/use-remove-friend";
import * as useAcceptModule from "../queries/use-accept-friend-request";
import * as useRefuseModule from "../queries/use-refuse-friend-request";
import * as useSendModule from "../queries/use-send-friend-request";

// La view compose ses containers : on neutralise la couche query pour ne tester
// que ce qui appartient à la view — la structure des onglets et le placement du
// badge. Le comportement de chaque panneau a ses propres tests.
vi.mock("@/shared/queries/use-received-count");
vi.mock("@/shared/queries/use-friends");
vi.mock("../queries/use-received-requests");
vi.mock("../queries/use-sent-requests");
vi.mock("../queries/use-search-users");
vi.mock("../queries/use-remove-friend");
vi.mock("../queries/use-accept-friend-request");
vi.mock("../queries/use-refuse-friend-request");
vi.mock("../queries/use-send-friend-request");

// ── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_QUERY = { data: [], isLoading: false, isError: false };
const IDLE_MUTATION = { mutate: vi.fn(), isPending: false };

// Les hooks TanStack ont chacun leur type de retour : un mock générique unique
// ne peut pas les satisfaire tous, d'où le cast au point d'affectation.
function mockEmptyQueries() {
  vi.mocked(useFriendsModule.useFriends).mockReturnValue(EMPTY_QUERY as never);
  vi.mocked(useReceivedRequestsModule.useReceivedRequests).mockReturnValue(
    EMPTY_QUERY as never,
  );
  vi.mocked(useSentRequestsModule.useSentRequests).mockReturnValue(EMPTY_QUERY as never);
  vi.mocked(useSearchUsersModule.useSearchUsers).mockReturnValue(EMPTY_QUERY as never);
}

function mockIdleMutations() {
  vi.mocked(useRemoveFriendModule.useRemoveFriend).mockReturnValue(
    IDLE_MUTATION as never,
  );
  vi.mocked(useAcceptModule.useAcceptFriendRequest).mockReturnValue(
    IDLE_MUTATION as never,
  );
  vi.mocked(useRefuseModule.useRefuseFriendRequest).mockReturnValue(
    IDLE_MUTATION as never,
  );
  vi.mocked(useSendModule.useSendFriendRequest).mockReturnValue(IDLE_MUTATION as never);
}

function mockReceivedCount(count?: number) {
  vi.mocked(useReceivedCountModule.useReceivedCount).mockReturnValue({
    data: count === undefined ? undefined : { count },
  } as unknown as ReturnType<typeof useReceivedCountModule.useReceivedCount>);
}

function renderView(onTabChange = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return {
    onTabChange,
    ...render(
      <QueryClientProvider client={queryClient}>
        <FriendsView
          activeTab="friends"
          onTabChange={onTabChange}
          counts={{ friends: 0, sent: 0 }}
        />
      </QueryClientProvider>,
    ),
  };
}

function getReceivedTrigger() {
  return screen.getByRole("tab", { name: /Reçues/ });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("FriendsView", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    mockEmptyQueries();
    mockIdleMutations();
    mockReceivedCount(undefined);
  });

  it("expose les quatre onglets de la page", () => {
    renderView();

    ["Amis", "Reçues", "Envoyées", "Chercher"].forEach((label) => {
      expect(screen.getByRole("tab", { name: new RegExp(label) })).toBeInTheDocument();
    });
  });

  it("rend le panneau de l'onglet actif", () => {
    renderView();

    expect(screen.getByText("Aucun compagnon dans votre liste pour l'instant.")).toBeInTheDocument();
  });

  it("remonte le changement d'onglet à son container", async () => {
    const user = userEvent.setup();
    const { onTabChange } = renderView();

    await user.click(getReceivedTrigger());

    expect(onTabChange).toHaveBeenCalledWith("received");
  });

  describe("UA-006 — Le badge se place dans l'onglet 'Reçues'", () => {
    it("affiche le compteur à l'intérieur du déclencheur 'Reçues'", () => {
      mockReceivedCount(3);

      renderView();

      expect(within(getReceivedTrigger()).getByText("3")).toBeInTheDocument();
    });

    it("laisse le déclencheur sans chiffre quand il n'y a rien en attente", () => {
      mockReceivedCount(0);

      renderView();

      expect(getReceivedTrigger().textContent).not.toMatch(/[0-9]/);
    });
  });
});

// ── Matrice de couverture UA ─────────────────────────────────────────────────
// UA-006 — Placement du badge dans l'onglet "Reçues" : COUVERT
// UA-007 / INV-008 — mise en forme du nombre : shared/components/molecules/count-badge.test.tsx
// UA-010 / INV-007 — masquage à zéro : received-count-badge.container.test.tsx
// UA-009 — rafraîchissement au clic sur "Reçues" : use-friends-tabs.test.ts
