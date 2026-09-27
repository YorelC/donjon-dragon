import { describe, expect, it } from "vitest";
import { abilityHintsOf, skillAbilityNamesOf } from "./ability-hints";
import { aCatalog } from "./catalog.fixture";

const CATALOG = aCatalog({
  abilities: [
    { key: "wisdom", name: "Sagesse", description: "Perception et discernement." },
    { key: "constitution", name: "Constitution", description: "Santé et endurance." },
  ],
  skills: [
    { key: "perception", name: "Perception", ability: "wisdom", description: "Repérer." },
    { key: "survival", name: "Survie", ability: "wisdom", description: "Pister." },
  ],
});

describe("infobulles des caractéristiques", () => {
  it("dit ce que mesure la caractéristique et les compétences qu'elle gouverne", () => {
    expect(abilityHintsOf(CATALOG).wisdom).toEqual({
      name: "Sagesse",
      description: "Perception et discernement.",
      skills: "Perception, Survie",
    });
  });

  // La Constitution ne gouverne aucune compétence : l'infobulle le dit plutôt que de laisser un vide.
  it("dit « aucune » pour une caractéristique sans compétence", () => {
    expect(abilityHintsOf(CATALOG).constitution?.skills).toBe("aucune");
  });

  it("nomme la caractéristique de chaque compétence", () => {
    expect(skillAbilityNamesOf(CATALOG)).toEqual({ perception: "Sagesse", survival: "Sagesse" });
  });
});
