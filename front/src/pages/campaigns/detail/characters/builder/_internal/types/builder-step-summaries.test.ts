import { describe, expect, it } from "vitest";
import { aCatalog, aClass } from "./catalog.fixture";
import { EMPTY_COMPOSITION, type CharacterComposition } from "./character-composition";
import { PENDING_SUMMARY, stepSummaryOf } from "./builder-step-summaries";
import type { StepContext } from "./builder-lookups";

function aContext(composition: Partial<CharacterComposition>): StepContext {
  const classes = [aClass({ key: "ranger", name: "Rôdeur", skillChoice: { count: 3, options: [] } })];

  return { catalog: aCatalog({ classes }), composition: { ...EMPTY_COMPOSITION, ...composition } };
}

describe("valeur d'une étape dans le rail", () => {
  it("nomme ce qui est retenu", () => {
    const context = aContext({ speciesKey: "dwarf", classKey: "ranger" });

    expect(stepSummaryOf("species", context)).toBe("Nain");
    expect(stepSummaryOf("class", context)).toBe("Rôdeur");
  });

  it("compte ce qui se choisit en nombre", () => {
    const context = aContext({ classKey: "ranger", classSkills: ["stealth"] });

    expect(stepSummaryOf("classSkills", context)).toBe("1 / 3");
    expect(stepSummaryOf("languages", aContext({ standardLanguages: ["elvish"] }))).toBe("1 / 2");
  });

  it("dit « À choisir » tant que rien n'est retenu", () => {
    expect(stepSummaryOf("class", aContext({}))).toBe(PENDING_SUMMARY);
    expect(stepSummaryOf("identity", aContext({ name: "   " }))).toBe(PENDING_SUMMARY);
  });

  it("nomme la méthode de caractéristiques, saisie manuelle comprise", () => {
    expect(stepSummaryOf("abilities", aContext({ abilityMethod: "manual" }))).toBe("Saisie manuelle");
  });
});
