import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CampaignDetail } from "@donjon-dragon/shared";
import type { MemberManagement } from "../hooks/use-member-management";
import type { MemberViewer } from "./member-row.view";
import { CampaignMembersView } from "./campaign-members.view";

// ── Helpers ──────────────────────────────────────────────────────────────────

function aCampaign(overrides: Partial<CampaignDetail> = {}): CampaignDetail {
  return {
    id: "3f1a2b4c-5d6e-4f70-8192-a3b4c5d6e7f8",
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

function management(overrides: Partial<MemberManagement> = {}): MemberManagement {
  return {
    pendingDisplayName: null,
    onPromote: vi.fn(),
    onDemote: vi.fn(),
    onRemove: vi.fn(),
    onCancelInvitation: vi.fn(),
    ...overrides,
  };
}

function renderMembers(
  campaign: CampaignDetail = aCampaign(),
  viewer: MemberViewer = { displayName: "Gandalf", canManage: true },
  actions: MemberManagement = management(),
) {
  return {
    ...render(
      <CampaignMembersView
        campaign={campaign}
        viewer={viewer}
        management={actions}
      />,
    ),
    actions,
  };
}

function rowOf(displayName: string): HTMLElement {
  const label = screen.getByText(displayName);

  return label.closest('[data-slot="card"]') as HTMLElement;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("CampaignMembersView (view pure)", () => {
  it("sépare les trois sections", () => {
    renderMembers();

    expect(screen.getByText("Maîtres du jeu")).toBeInTheDocument();
    expect(screen.getByText("Joueurs")).toBeInTheDocument();
    expect(screen.getByText("Invitations en attente")).toBeInTheDocument();
  });

  it("annonce une section vide plutôt que de la laisser muette", () => {
    renderMembers(aCampaign({ pendingInvitees: [] }));

    expect(screen.getAllByText("Personne pour le moment.")).toHaveLength(1);
  });

  it("marque le propriétaire d'un badge, visible de tous", () => {
    renderMembers(aCampaign({ myRole: "player", isOwner: false }), {
      displayName: "Frodon",
      canManage: false,
    });

    expect(within(rowOf("Gandalf")).getByText("Propriétaire")).toBeInTheDocument();
  });

  it("marque le propriétaire même quand il n'est que joueur", () => {
    renderMembers(aCampaign({ owner: { displayName: "Frodon" }, isOwner: false }));

    expect(within(rowOf("Frodon")).getByText("Propriétaire")).toBeInTheDocument();
    expect(within(rowOf("Gandalf")).queryByText("Propriétaire")).toBeNull();
  });
});

describe("CampaignMembersView — qui peut agir", () => {
  it("ne propose aucune action à un joueur", () => {
    renderMembers(aCampaign({ myRole: "player", isOwner: false }), {
      displayName: "Frodon",
      canManage: false,
    });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("propose promouvoir et retirer sur un joueur", () => {
    renderMembers();

    const row = within(rowOf("Frodon"));
    expect(row.getByRole("button", { name: "Promouvoir" })).toBeInTheDocument();
    expect(row.getByRole("button", { name: "Retirer" })).toBeInTheDocument();
  });

  it("propose d'annuler une invitation en attente", () => {
    renderMembers();

    expect(
      within(rowOf("Sam")).getByRole("button", { name: "Annuler l'invitation" }),
    ).toBeInTheDocument();
  });

  it("ne propose rien sur sa propre ligne", () => {
    renderMembers(aCampaign({ owner: { displayName: "Frodon" }, isOwner: false }));

    expect(within(rowOf("Gandalf")).queryByRole("button")).toBeNull();
  });

  it("ne propose rien sur la ligne du propriétaire", () => {
    const campaign = aCampaign({
      gameMasters: [{ displayName: "Gandalf" }, { displayName: "Aragorn" }],
      owner: { displayName: "Aragorn" },
      isOwner: false,
    });
    renderMembers(campaign);

    expect(within(rowOf("Aragorn")).queryByRole("button")).toBeNull();
  });

  it("propose de rétrograder un autre maître du jeu", () => {
    const campaign = aCampaign({
      gameMasters: [{ displayName: "Gandalf" }, { displayName: "Aragorn" }],
    });
    renderMembers(campaign);

    expect(
      within(rowOf("Aragorn")).getByRole("button", { name: "Rétrograder" }),
    ).toBeInTheDocument();
  });
});

describe("CampaignMembersView — actions", () => {
  it("promeut le membre de la ligne cliquée", async () => {
    const { actions } = renderMembers();

    await userEvent.click(
      within(rowOf("Frodon")).getByRole("button", { name: "Promouvoir" }),
    );

    expect(actions.onPromote).toHaveBeenCalledWith("Frodon");
  });

  it("retire le membre de la ligne cliquée", async () => {
    const { actions } = renderMembers();

    await userEvent.click(
      within(rowOf("Frodon")).getByRole("button", { name: "Retirer" }),
    );

    expect(actions.onRemove).toHaveBeenCalledWith("Frodon");
    expect(actions.onCancelInvitation).not.toHaveBeenCalled();
  });

  // Retirer un membre et annuler une invitation sont deux routes serveur
  // distinctes : les confondre appelait celle des membres sur un non-membre.
  it("annule l'invitation par une action distincte du retrait", async () => {
    const { actions } = renderMembers();

    await userEvent.click(
      within(rowOf("Sam")).getByRole("button", { name: "Annuler l'invitation" }),
    );

    expect(actions.onCancelInvitation).toHaveBeenCalledWith("Sam");
    expect(actions.onRemove).not.toHaveBeenCalled();
  });

  it("ne fige que la ligne dont l'action est en vol", () => {
    renderMembers(aCampaign(), undefined, management({ pendingDisplayName: "Frodon" }));

    expect(
      within(rowOf("Frodon")).getByRole("button", { name: "Promouvoir" }),
    ).toBeDisabled();
    expect(
      within(rowOf("Sam")).getByRole("button", { name: "Annuler l'invitation" }),
    ).toBeEnabled();
  });
});
