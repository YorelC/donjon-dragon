import { describe, it, expect } from "vitest";
import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import { toMemberCharacterLine, type CharacterReader } from "./member-character";

// ── Helpers ──────────────────────────────────────────────────────────────────

const BUILD = {
  speciesKey: "elf",
  speciesName: "Elfe",
  lineageName: null,
  classKey: "ranger",
  className: "Rôdeur",
  backgroundKey: "sage",
  backgroundName: "Sage",
} as const;

function aCharacter(
  overrides: Partial<Extract<CampaignCharacterListItem, { projection: "gameMaster" }>> = {},
): CampaignCharacterListItem {
  return {
    projection: "gameMaster",
    id: "8b6b0a9c-2c2f-4a5e-8f2f-1b3d4e5f6a7b",
    name: "Vaelira",
    portrait: null,
    status: "waiting_adventure",
    review: { status: "draft", submittedVersion: null, lastRejectionReason: null },
    speciesName: "Elfe",
    lineageName: null,
    className: "Rôdeur",
    level: 1,
    assignmentStatus: "assigned",
    build: BUILD,
    personalDetails: { age: 120, weightKg: 62, description: null },
    assignedTo: { displayName: "Legolas" },
    revision: 0,
    createdByMe: true,
    ...overrides,
  };
}

const gameMaster: CharacterReader = {
  displayName: "Gandalf",
  seesEveryAssignment: true,
};

const player: CharacterReader = {
  displayName: "Legolas",
  seesEveryAssignment: false,
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("toMemberCharacterLine", () => {
  it("décrit le personnage mené par le membre", () => {
    const line = toMemberCharacterLine("Legolas", [aCharacter()], gameMaster);

    expect(line).toBe("Vaelira · Rôdeur niveau 1");
  });

  it("annonce l'absence de personnage au maître du jeu", () => {
    expect(toMemberCharacterLine("Frodon", [aCharacter()], gameMaster)).toBe(
      "Aucun personnage associé",
    );
  });

  it("compte les personnages quand un membre en mène plusieurs", () => {
    const second = aCharacter({
      id: "1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f",
      name: "Thundrin",
    });

    expect(toMemberCharacterLine("Legolas", [aCharacter(), second], player)).toBe(
      "2 personnages",
    );
  });

  it("constate son propre manque de personnage", () => {
    expect(toMemberCharacterLine("Legolas", [], player)).toBe(
      "Aucun personnage associé",
    );
  });

  // Le serveur ne dit pas à un joueur qui mène les autres fiches : se taire est
  // la seule réponse honnête, affirmer une absence serait un mensonge.
  it("se tait sur un autre membre quand le lecteur ne voit pas les attributions", () => {
    expect(toMemberCharacterLine("Frodon", [aCharacter()], player)).toBeUndefined();
  });
});
