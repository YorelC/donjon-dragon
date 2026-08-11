import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CampaignExit } from "../hooks/use-campaign-exit";
import { CampaignExitView } from "./campaign-exit.view";

// ── Helpers ──────────────────────────────────────────────────────────────────

function exitState(overrides: Partial<CampaignExit> = {}): CampaignExit {
  return {
    isOwner: false,
    needsSuccessor: false,
    candidates: [],
    successor: "",
    onSelectSuccessor: vi.fn(),
    onLeave: vi.fn(),
    onDelete: vi.fn(),
    onTransfer: vi.fn(),
    isBusy: false,
    ...overrides,
  };
}

function renderExit(overrides: Partial<CampaignExit> = {}) {
  const exit = exitState(overrides);

  return { ...render(<CampaignExitView exit={exit} />), exit };
}

const owner = (overrides: Partial<CampaignExit> = {}) =>
  renderExit({
    isOwner: true,
    needsSuccessor: true,
    candidates: ["Frodon", "Sam"],
    ...overrides,
  });

// ── Tests ────────────────────────────────────────────────────────────────────

describe("CampaignExitView — ce qui est proposé", () => {
  it("laisse tout membre quitter la campagne", () => {
    renderExit();

    expect(
      screen.getByRole("button", { name: "Quitter la campagne" }),
    ).toBeInTheDocument();
  });

  it("ne propose ni suppression ni transfert à qui n'est pas propriétaire", () => {
    renderExit();

    expect(
      screen.queryByRole("button", { name: "Supprimer la campagne" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Transférer la propriété" }),
    ).not.toBeInTheDocument();
  });

  it("réserve suppression et transfert au propriétaire", () => {
    owner();

    expect(
      screen.getByRole("button", { name: "Supprimer la campagne" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Transférer la propriété" }),
    ).toBeInTheDocument();
  });
});

describe("CampaignExitView — quitter", () => {
  it("part sans successeur quand on n'est pas propriétaire", async () => {
    const { exit } = renderExit();

    await userEvent.click(
      screen.getByRole("button", { name: "Quitter la campagne" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Quitter" }));

    expect(exit.onLeave).toHaveBeenCalled();
  });

  it("demande un successeur au propriétaire qui part", async () => {
    owner();

    await userEvent.click(
      screen.getByRole("button", { name: "Quitter la campagne" }),
    );

    expect(screen.getByText("Nouveau propriétaire")).toBeInTheDocument();
  });

  it("bloque le départ du propriétaire tant qu'il n'a désigné personne", async () => {
    owner();

    await userEvent.click(
      screen.getByRole("button", { name: "Quitter la campagne" }),
    );

    expect(screen.getByRole("button", { name: "Quitter" })).toBeDisabled();
  });

  it("débloque le départ dès qu'un successeur est choisi", async () => {
    owner({ successor: "Frodon" });

    await userEvent.click(
      screen.getByRole("button", { name: "Quitter la campagne" }),
    );

    expect(screen.getByRole("button", { name: "Quitter" })).toBeEnabled();
  });

  it("ne demande pas de successeur au propriétaire resté seul", async () => {
    renderExit({ isOwner: true, needsSuccessor: false, candidates: [] });

    await userEvent.click(
      screen.getByRole("button", { name: "Quitter la campagne" }),
    );

    expect(screen.queryByText("Nouveau propriétaire")).not.toBeInTheDocument();
  });
});

describe("CampaignExitView — propriété et suppression", () => {
  it("transfère au membre choisi", async () => {
    const { exit } = owner({ successor: "Frodon" });

    await userEvent.click(
      screen.getByRole("button", { name: "Transférer la propriété" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Transférer" }));

    expect(exit.onTransfer).toHaveBeenCalled();
  });

  it("bloque le transfert tant qu'aucun successeur n'est choisi", async () => {
    owner();

    await userEvent.click(
      screen.getByRole("button", { name: "Transférer la propriété" }),
    );

    expect(screen.getByRole("button", { name: "Transférer" })).toBeDisabled();
  });

  it("prévient que la suppression est définitive avant de la lancer", async () => {
    const { exit } = owner();

    await userEvent.click(
      screen.getByRole("button", { name: "Supprimer la campagne" }),
    );

    expect(
      screen.getByText(
        "Elle disparaîtra pour tous ses membres. Cette action est définitive.",
      ),
    ).toBeInTheDocument();
    expect(exit.onDelete).not.toHaveBeenCalled();
  });

  it("supprime après confirmation", async () => {
    const { exit } = owner();

    await userEvent.click(
      screen.getByRole("button", { name: "Supprimer la campagne" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    expect(exit.onDelete).toHaveBeenCalled();
  });

  it("fige les trois actions pendant qu'une requête est en vol", () => {
    owner({ isBusy: true });

    expect(
      screen.getByRole("button", { name: "Quitter la campagne" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Transférer la propriété" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Supprimer la campagne" }),
    ).toBeDisabled();
  });
});
