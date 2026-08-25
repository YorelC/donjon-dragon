import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { CampaignDetail } from "@donjon-dragon/shared";
import type { CampaignFriend } from "../queries/use-my-friends";

vi.mock("../queries/use-my-friends", () => ({ useMyFriends: vi.fn() }));
vi.mock("@/shared/queries/use-campaign-detail", () => ({ useCampaignDetail: vi.fn() }));
vi.mock("../queries/use-invite-to-campaign", () => ({
  useInviteToCampaign: vi.fn(),
}));

import { useMyFriends } from "../queries/use-my-friends";
import { useCampaignDetail } from "@/shared/queries/use-campaign-detail";
import { useInviteToCampaign } from "../queries/use-invite-to-campaign";
import { useInviteToCampaignForm } from "./use-invite-to-campaign-form";

// ── Helpers ──────────────────────────────────────────────────────────────────

const CAMPAIGN_ID = "3f1a2b4c-5d6e-4f70-8192-a3b4c5d6e7f8";

const FRIENDS: CampaignFriend[] = [
  { friendshipId: "uuid-1", friend: { displayName: "Gandalf" } },
  { friendshipId: "uuid-2", friend: { displayName: "Frodon" } },
  { friendshipId: "uuid-3", friend: { displayName: "Sam" } },
  { friendshipId: "uuid-4", friend: { displayName: "Aragorn" } },
];

function aCampaign(overrides: Partial<CampaignDetail> = {}): CampaignDetail {
  return {
    id: CAMPAIGN_ID,
    revision: 0,
    name: "La Malédiction de Strahd",
    myRole: "gameMaster",
    isOwner: true,
    owner: { displayName: "Gandalf" },
    gameMasters: [{ displayName: "Gandalf" }],
    players: [{ displayName: "Frodon" }],
    pendingInvitees: [{ displayName: "Sam" }],
    ...overrides,
  };
}

/**
 * Les hooks TanStack rendent une grappe dont le formulaire ne lit que trois
 * champs. Le double s'y limite, et le cast passe par `unknown` plutôt que par
 * `any`, que le lint interdit.
 */
const friendsQuery = (data: CampaignFriend[]) =>
  ({ data, isLoading: false, isError: false }) as unknown as ReturnType<
    typeof useMyFriends
  >;

const detailQuery = (data: CampaignDetail | undefined) =>
  ({ data, isLoading: false, isError: false }) as unknown as ReturnType<
    typeof useCampaignDetail
  >;

const inviteMutation = () =>
  ({ mutate: vi.fn(), isPending: false }) as unknown as ReturnType<
    typeof useInviteToCampaign
  >;

/** `null` dit « détail pas encore chargé » : `undefined` réactiverait le défaut. */
function renderForm(campaign: CampaignDetail | null = aCampaign()) {
  vi.mocked(useMyFriends).mockReturnValue(friendsQuery(FRIENDS));
  vi.mocked(useCampaignDetail).mockReturnValue(detailQuery(campaign ?? undefined));

  return renderHook(() => useInviteToCampaignForm(CAMPAIGN_ID));
}

const invitableNames = (result: {
  current: { friends: { data: CampaignFriend[] } };
}) => result.current.friends.data.map((friend) => friend.friend.displayName);

// ── Tests ────────────────────────────────────────────────────────────────────

describe("useInviteToCampaignForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useInviteToCampaign).mockReturnValue(inviteMutation());
  });

  describe("qui reste invitable", () => {
    it("écarte les amis déjà membres et déjà invités", () => {
      const { result } = renderForm();

      expect(invitableNames(result)).toEqual(["Aragorn"]);
    });

    it("écarte un ami déjà maître du jeu", () => {
      const { result } = renderForm();

      expect(invitableNames(result)).not.toContain("Gandalf");
    });

    it("écarte un ami déjà joueur", () => {
      const { result } = renderForm();

      expect(invitableNames(result)).not.toContain("Frodon");
    });

    it("écarte un ami déjà invité, qui n a pas encore répondu", () => {
      const { result } = renderForm();

      expect(invitableNames(result)).not.toContain("Sam");
    });

    it("propose tous les amis quand la campagne n a personne d autre", () => {
      const { result } = renderForm(
        aCampaign({ players: [], pendingInvitees: [] }),
      );

      expect(invitableNames(result)).toEqual(["Frodon", "Sam", "Aragorn"]);
    });

    it("ne filtre rien tant que le détail n est pas chargé", () => {
      const { result } = renderForm(null);

      expect(invitableNames(result)).toHaveLength(FRIENDS.length);
    });
  });

  describe("état de la modale", () => {
    it("naît fermée et sans sélection", () => {
      const { result } = renderForm();

      expect(result.current.open).toBe(false);
      expect(result.current.selectedDisplayName).toBe("");
    });

    it("ne charge les amis qu une fois la modale ouverte", () => {
      const { result } = renderForm();

      expect(useMyFriends).toHaveBeenLastCalledWith(false);

      act(() => result.current.onOpenChange(true));

      expect(useMyFriends).toHaveBeenLastCalledWith(true);
    });

    it("retient l ami choisi", () => {
      const { result } = renderForm();

      act(() => result.current.onSelect("Aragorn"));

      expect(result.current.selectedDisplayName).toBe("Aragorn");
    });
  });
});
