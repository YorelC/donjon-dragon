import { describe, it, expect } from "vitest";
import { aCatalog, aSpecies, aSpeciesWithSizeChoice } from "./catalog.fixture";
import { EMPTY_COMPOSITION, type CharacterComposition } from "./character-composition";
import { resolvedSizeOf, type StepContext } from "./builder-lookups";
import { isStepValid } from "./builder-steps";

function aContext(composition: Partial<CharacterComposition>): StepContext {
  return { catalog: aCatalog(), composition: { ...EMPTY_COMPOSITION, ...composition } };
}

describe("étape des langues", () => {
  it("exige deux langues, ni une ni trois", () => {
    expect(isStepValid("languages", aContext({ standardLanguages: ["elvish"] }))).toBe(false);
    expect(isStepValid("languages", aContext({ standardLanguages: ["elvish", "orc"] })))
      .toBe(true);
  });

  // Un doublon remplirait deux emplacements avec une seule langue.
  it("refuse deux fois la même langue", () => {
    const context = aContext({ standardLanguages: ["elvish", "elvish"] });

    expect(isStepValid("languages", context)).toBe(false);
  });

  /**
   * Le Commun est accordé d'office et les langues rares relèvent d'autres
   * sources : ni l'un ni les autres ne remplissent un des deux emplacements.
   */
  it.each(["common", "abyssal"] as const)("ne compte pas « %s » dans le quota", (language) => {
    const context = aContext({ standardLanguages: ["elvish", language] });

    expect(isStepValid("languages", context)).toBe(false);
  });
});

describe("étape d’identité", () => {
  const COMPLETE = {
    name: "Frodo Sacquet",
    alignment: "neutralGood",
    age: 33,
    heightCm: 96,
    weightKg: 30,
  } as const;

  it("est valide quand l’état civil est complet", () => {
    expect(isStepValid("identity", aContext({ ...COMPLETE }))).toBe(true);
  });

  it.each(["alignment", "age", "heightCm", "weightKg"] as const)(
    "reste invalide sans %s",
    (field) => {
      expect(isStepValid("identity", aContext({ ...COMPLETE, [field]: null }))).toBe(false);
    },
  );

  it("n’exige pas la description, que le contrat ne demande pas", () => {
    expect(isStepValid("identity", aContext({ ...COMPLETE, description: null }))).toBe(true);
  });

  it("refuse un nom vide ou fait d’espaces", () => {
    expect(isStepValid("identity", aContext({ ...COMPLETE, name: "   " }))).toBe(false);
  });
});

describe("gabarit — la taille effective", () => {
  function contextFor(
    species: ReturnType<typeof aSpecies>,
    composition: Partial<CharacterComposition>,
  ): StepContext {
    return {
      catalog: aCatalog({ species: [species] }),
      composition: { ...EMPTY_COMPOSITION, speciesKey: species.key, ...composition },
    };
  }

  it("dérive la taille d’une espèce qui n’en offre qu’une", () => {
    const context = contextFor(aSpecies({ key: "dwarf" }), {});

    expect(resolvedSizeOf(context)).toBe("Medium");
    expect(isStepValid("species", context)).toBe(true);
  });

  it("reste sans taille tant qu’une espèce à choix n’a pas tranché", () => {
    const context = contextFor(aSpeciesWithSizeChoice("human"), {});

    expect(resolvedSizeOf(context)).toBeNull();
    expect(isStepValid("species", context)).toBe(false);
  });

  it("retient le gabarit choisi quand l’espèce l’autorise", () => {
    const context = contextFor(aSpeciesWithSizeChoice("human"), { selectedSize: "Small" });

    expect(resolvedSizeOf(context)).toBe("Small");
    expect(isStepValid("species", context)).toBe(true);
  });

  /**
   * Le filet sous le reset : même si un choix périmé survivait au changement
   * d'espèce, la taille imposée l'emporte. C'est ce qui empêche un Humain passé
   * en Small, puis changé pour un Nain, de rester Small.
   */
  it("ignore un choix que la nouvelle espèce n’autorise pas", () => {
    const context = contextFor(aSpecies({ key: "dwarf" }), { selectedSize: "Small" });

    expect(resolvedSizeOf(context)).toBe("Medium");
  });

  it("ignore un choix absent des options de l’espèce", () => {
    const species = aSpeciesWithSizeChoice("human", ["Medium"]);
    const context = contextFor(species, { selectedSize: "Small" });

    expect(resolvedSizeOf(context)).toBe("Medium");
  });
});
