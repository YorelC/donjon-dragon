import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { CampaignSummary } from "@donjon-dragon/shared";
import type { QueryState } from "@/shared/types/ui-state";
import { MyCampaignsView } from "./my-campaigns.view";

// ── Helpers ──────────────────────────────────────────────────────────────────

function aCampaign(overrides: Partial<CampaignSummary> = {}): CampaignSummary {
  return {
    id: "3f1a2b4c-5d6e-4f70-8192-a3b4c5d6e7f8",
    name: "La Malédiction de Strahd",
    myRole: "gameMaster",
    gameMasterCount: 1,
    playerCount: 0,
    ...overrides,
  };
}

function queryState(
  overrides: Partial<QueryState<CampaignSummary[]>> = {},
): QueryState<CampaignSummary[]> {
  return { data: [aCampaign()], loading: false, error: false, ...overrides };
}

/** La carte est un lien : il lui faut un routeur, mais plus aucun provider de données. */
function renderList(campaigns: QueryState<CampaignSummary[]> = queryState()) {
  return render(
    <MemoryRouter>
      <MyCampaignsView campaigns={campaigns} />
    </MemoryRouter>,
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("MyCampaignsView (view pure)", () => {
  it("affiche le chargement", () => {
    renderList(queryState({ loading: true }));

    expect(screen.getByText("Chargement...")).toBeInTheDocument();
  });

  it("affiche l'erreur", () => {
    renderList(queryState({ error: true }));

    expect(
      screen.getByText("Erreur lors du chargement des campagnes."),
    ).toBeInTheDocument();
  });

  it("invite à créer quand la liste est vide", () => {
    renderList(queryState({ data: [] }));

    expect(
      screen.getByText("Tu ne participes à aucune campagne. Crée la première."),
    ).toBeInTheDocument();
  });

  it("liste chaque campagne par son nom", () => {
    renderList(
      queryState({
        data: [
          aCampaign({ id: "a", name: "La Malédiction de Strahd" }),
          aCampaign({ id: "b", name: "Le Tombeau des Horreurs" }),
        ],
      }),
    );

    expect(screen.getByText("La Malédiction de Strahd")).toBeInTheDocument();
    expect(screen.getByText("Le Tombeau des Horreurs")).toBeInTheDocument();
  });

  it.each([
    ["gameMaster" as const, "Maître du jeu"],
    ["player" as const, "Joueur"],
  ])("affiche le rôle du lecteur (%s)", (myRole, label) => {
    renderList(queryState({ data: [aCampaign({ myRole })] }));

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("accorde les effectifs au singulier", () => {
    renderList(
      queryState({ data: [aCampaign({ gameMasterCount: 1, playerCount: 1 })] }),
    );

    expect(screen.getByText(/1 maître du jeu · 1 joueur/)).toBeInTheDocument();
  });

  it("accorde les effectifs au pluriel", () => {
    renderList(
      queryState({ data: [aCampaign({ gameMasterCount: 2, playerCount: 3 })] }),
    );

    expect(screen.getByText(/2 maîtres du jeu · 3 joueurs/)).toBeInTheDocument();
  });

  it("accorde zéro joueur au singulier", () => {
    renderList(queryState({ data: [aCampaign({ playerCount: 0 })] }));

    expect(screen.getByText(/0 joueur$/)).toBeInTheDocument();
  });

  it("mène au détail de la campagne, quel que soit le rôle", () => {
    renderList(queryState({ data: [aCampaign({ myRole: "player" })] }));

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/campaigns/3f1a2b4c-5d6e-4f70-8192-a3b4c5d6e7f8",
    );
  });

  it("n'expose plus l'invitation depuis la liste : elle vit dans le détail", () => {
    renderList(queryState({ data: [aCampaign({ myRole: "gameMaster" })] }));

    expect(screen.queryByRole("button", { name: "Inviter" })).not.toBeInTheDocument();
  });
});
