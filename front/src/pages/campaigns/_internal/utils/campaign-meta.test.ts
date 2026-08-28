import { describe, it, expect } from "vitest";
import type { CampaignSummary } from "@donjon-dragon/shared";
import { toCampaignHeadcount } from "./campaign-meta";

function aCampaign(overrides: Partial<CampaignSummary> = {}): CampaignSummary {
  return {
    id: "3f1a2b4c-5d6e-4f70-8192-a3b4c5d6e7f8",
    name: "La Malédiction de Strahd",
    myRole: "gameMaster",
    isOwner: true,
    gameMasterCount: 1,
    playerCount: 0,
    ...overrides,
  };
}

describe("toCampaignHeadcount", () => {
  it("accorde les effectifs au singulier", () => {
    expect(
      toCampaignHeadcount(aCampaign({ gameMasterCount: 1, playerCount: 1 })),
    ).toBe("1 maître du jeu · 1 joueur");
  });

  it("accorde les effectifs au pluriel", () => {
    expect(
      toCampaignHeadcount(aCampaign({ gameMasterCount: 2, playerCount: 3 })),
    ).toBe("2 maîtres du jeu · 3 joueurs");
  });

  it("accorde zéro joueur au singulier", () => {
    expect(toCampaignHeadcount(aCampaign({ playerCount: 0 }))).toBe(
      "1 maître du jeu · 0 joueur",
    );
  });
});
