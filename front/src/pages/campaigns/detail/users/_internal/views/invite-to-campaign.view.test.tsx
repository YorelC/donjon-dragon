import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { InviteToCampaignFormState } from "../hooks/use-invite-to-campaign-form";
import type { CampaignFriend } from "../queries/use-my-friends";
import { InviteToCampaignView } from "./invite-to-campaign.view";

// ── Helpers ──────────────────────────────────────────────────────────────────

const FRIENDS: CampaignFriend[] = [
  { friendshipId: "uuid-1", friend: { displayName: "Frodon" } },
  { friendshipId: "uuid-2", friend: { displayName: "Sam" } },
];

function inviteState(
  overrides: Partial<InviteToCampaignFormState> = {},
): InviteToCampaignFormState {
  return {
    open: true,
    onOpenChange: vi.fn(),
    friends: { data: FRIENDS, loading: false, error: false },
    selectedDisplayName: "",
    onSelect: vi.fn(),
    onSubmit: vi.fn(),
    isSubmitting: false,
    ...overrides,
  };
}

function renderDialog(overrides: Partial<InviteToCampaignFormState> = {}) {
  const invite = inviteState(overrides);

  return { ...render(<InviteToCampaignView invite={invite} />), invite };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("InviteToCampaignView (view pure)", () => {
  it("expose toujours le bouton Inviter", () => {
    renderDialog({ open: false });

    expect(screen.getByRole("button", { name: "Inviter" })).toBeInTheDocument();
  });

  it("demande l'ouverture au clic sur le déclencheur", async () => {
    const { invite } = renderDialog({ open: false });

    await userEvent.click(screen.getByRole("button", { name: "Inviter" }));

    expect(invite.onOpenChange).toHaveBeenCalledWith(true);
  });

  it("propose de choisir parmi les amis", () => {
    renderDialog();

    expect(screen.getByText("Ami à inviter")).toBeInTheDocument();
    expect(screen.getByText("Choisis un ami")).toBeInTheDocument();
  });

  it("dit pourquoi la liste peut être vide plutôt que d'afficher un menu vide", () => {
    renderDialog({ friends: { data: [], loading: false, error: false } });

    expect(screen.getByText(/Aucun ami à inviter/)).toBeInTheDocument();
  });

  it("affiche le chargement des amis", () => {
    renderDialog({ friends: { data: [], loading: true, error: false } });

    expect(screen.getByText("Chargement...")).toBeInTheDocument();
  });

  it("affiche l'erreur de chargement des amis", () => {
    renderDialog({ friends: { data: [], loading: false, error: true } });

    expect(
      screen.getByText("Erreur lors du chargement de tes amis."),
    ).toBeInTheDocument();
  });

  it("empêche d'envoyer tant qu'aucun ami n'est choisi", () => {
    renderDialog();

    expect(submitButton()).toBeDisabled();
  });

  it("autorise l'envoi dès qu'un ami est choisi", () => {
    renderDialog({ selectedDisplayName: "Frodon" });

    expect(submitButton()).toBeEnabled();
  });

  it("envoie l'invitation", async () => {
    const { invite } = renderDialog({ selectedDisplayName: "Frodon" });

    await userEvent.click(submitButton());

    expect(invite.onSubmit).toHaveBeenCalled();
  });

  it("désactive et renomme le bouton pendant l'envoi", () => {
    renderDialog({ selectedDisplayName: "Frodon", isSubmitting: true });

    expect(screen.getByRole("button", { name: "Envoi..." })).toBeDisabled();
  });
});

/** Le déclencheur et le bouton d'envoi portent tous deux le mot « Inviter ». */
function submitButton(): HTMLElement {
  const buttons = screen.getAllByRole("button", { name: "Inviter" });

  return buttons[buttons.length - 1] as HTMLElement;
}
