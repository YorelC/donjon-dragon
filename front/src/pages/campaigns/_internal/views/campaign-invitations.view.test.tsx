import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CampaignInvitation } from "@donjon-dragon/shared";
import type { QueryState } from "@/shared/types/ui-state";
import type { InvitationAnswer } from "../hooks/use-invitation-answer";
import { CampaignInvitationsView } from "./campaign-invitations.view";

// ── Helpers ──────────────────────────────────────────────────────────────────

const CAMPAIGN_ID = "3f1a2b4c-5d6e-4f70-8192-a3b4c5d6e7f8";

function anInvitation(
  overrides: Partial<CampaignInvitation> = {},
): CampaignInvitation {
  return {
    campaignId: CAMPAIGN_ID,
    name: "La Malédiction de Strahd",
    invitedBy: { displayName: "Gandalf" },
    ...overrides,
  };
}

function answerState(overrides: Partial<InvitationAnswer> = {}): InvitationAnswer {
  return {
    pendingCampaignId: null,
    onAccept: vi.fn(),
    onRefuse: vi.fn(),
    ...overrides,
  };
}

function queryState(
  overrides: Partial<QueryState<CampaignInvitation[]>> = {},
): QueryState<CampaignInvitation[]> {
  return { data: [anInvitation()], loading: false, error: false, ...overrides };
}

function renderList(
  invitations: QueryState<CampaignInvitation[]> = queryState(),
  answer: InvitationAnswer = answerState(),
) {
  return {
    ...render(
      <CampaignInvitationsView invitations={invitations} answer={answer} />,
    ),
    answer,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("CampaignInvitationsView (view pure)", () => {
  it("affiche le chargement", () => {
    renderList(queryState({ loading: true }));

    expect(screen.getByText("Chargement...")).toBeInTheDocument();
  });

  it("affiche l'erreur", () => {
    renderList(queryState({ error: true }));

    expect(
      screen.getByText("Erreur lors du chargement des demandes."),
    ).toBeInTheDocument();
  });

  it("annonce l'absence de demande", () => {
    renderList(queryState({ data: [] }));

    expect(
      screen.getByText("Aucune demande de campagne pour le moment."),
    ).toBeInTheDocument();
  });

  it("nomme la campagne et l'ami qui invite", () => {
    renderList();

    expect(screen.getByText("La Malédiction de Strahd")).toBeInTheDocument();
    expect(screen.getByText("Invitation de Gandalf")).toBeInTheDocument();
  });

  it("accepte la demande de la bonne campagne", async () => {
    const { answer } = renderList();

    await userEvent.click(screen.getByRole("button", { name: "Accepter" }));

    expect(answer.onAccept).toHaveBeenCalledWith(CAMPAIGN_ID);
    expect(answer.onRefuse).not.toHaveBeenCalled();
  });

  it("refuse la demande de la bonne campagne", async () => {
    const { answer } = renderList();

    await userEvent.click(screen.getByRole("button", { name: "Refuser" }));

    expect(answer.onRefuse).toHaveBeenCalledWith(CAMPAIGN_ID);
    expect(answer.onAccept).not.toHaveBeenCalled();
  });

  it("désactive les deux boutons de la ligne en cours de réponse", () => {
    renderList(queryState(), answerState({ pendingCampaignId: CAMPAIGN_ID }));

    expect(screen.getByRole("button", { name: "Accepter" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Refuser" })).toBeDisabled();
  });

  it("ne désactive QUE la ligne en cours, pas les autres", () => {
    const other = anInvitation({ campaignId: "autre", name: "Le Tombeau" });
    renderList(
      queryState({ data: [anInvitation(), other] }),
      answerState({ pendingCampaignId: CAMPAIGN_ID }),
    );

    const acceptButtons = screen.getAllByRole("button", { name: "Accepter" });

    expect(acceptButtons[0]).toBeDisabled();
    expect(acceptButtons[1]).toBeEnabled();
  });
});
