import { describe, it, expect } from "vitest";
import { aBackground, aCatalog, aClass, aSpecies, aSpeciesWithSizeChoice } from "./catalog.fixture";
import { EMPTY_COMPOSITION, type CharacterComposition } from "./character-composition";
import { cantripQuotaOf, type StepContext } from "./builder-lookups";
import { isStepValid, visibleSteps } from "./builder-steps";

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
    heightCm: 140,
    weightKg: 70,
    speciesKey: "dwarf",
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

  it.each([
    ["heightCm", 121],
    ["heightCm", 153],
    ["weightKg", 52],
    ["weightKg", 104],
  ] as const)("refuse %s = %i hors des bornes du nain", (field, value) => {
    expect(isStepValid("identity", aContext({ ...COMPLETE, [field]: value }))).toBe(false);
  });
});

describe("étape espèce sans gabarit à choisir", () => {
  function contextFor(species: ReturnType<typeof aSpecies>): StepContext {
    return {
      catalog: aCatalog({ species: [species] }),
      composition: { ...EMPTY_COMPOSITION, speciesKey: species.key },
    };
  }

  it("est valide pour une espèce à catégorie fixe", () => {
    expect(isStepValid("species", contextFor(aSpecies({ key: "dwarf" })))).toBe(true);
  });

  it("est valide pour une espèce P/M avant toute taille physique", () => {
    expect(isStepValid("species", contextFor(aSpeciesWithSizeChoice("human")))).toBe(true);
  });
});

describe("maîtrises, outils et langue de classe", () => {
  const fighter = aClass({
    key: "fighter",
    weaponMastery: { count: 2, options: ["longsword", "shortbow"] },
  });

  it("valide strictement quota, unicité et catalogue des maîtrises", () => {
    const catalog = aCatalog({ classes: [fighter] });
    const composition = { classKey: "fighter" as const, weaponMasteries: ["longsword", "shortbow"] };

    expect(isStepValid("weaponMasteries", { catalog, composition: { ...EMPTY_COMPOSITION, ...composition } })).toBe(true);
    expect(isStepValid("weaponMasteries", { catalog, composition: { ...EMPTY_COMPOSITION, classKey: "fighter", weaponMasteries: ["longsword", "longsword"] } })).toBe(false);
    expect(isStepValid("weaponMasteries", { catalog, composition: { ...EMPTY_COMPOSITION, classKey: "fighter", weaponMasteries: ["longsword", "club"] } })).toBe(false);
  });

  it("place l'historique avant les compétences et l'expertise après les dons", () => {
    const rogue = aClass({ key: "rogue", expertiseCount: 2 });
    const context: StepContext = {
      catalog: aCatalog({ classes: [rogue] }),
      composition: { ...EMPTY_COMPOSITION, classKey: "rogue", backgroundKey: "acolyte" },
    };
    const steps = visibleSteps(context);

    expect(steps.indexOf("background")).toBeLessThan(steps.indexOf("classSkills"));
    expect(steps.indexOf("feats")).toBeLessThan(steps.indexOf("expertise"));
  });

  it("exige l'outil de l'historique dans sa liste publiée", () => {
    const background = aBackground({ toolOptions: ["dice-set"] });
    const catalog = aCatalog({ backgrounds: [background] });

    expect(isStepValid("backgroundTool", {
      catalog, composition: { ...EMPTY_COMPOSITION, backgroundKey: "acolyte", backgroundTool: "dice-set" },
    })).toBe(true);
  });
});

describe("magie de niveau 1", () => {
  const invocations = [
    { key: "armor-of-shadows", name: "Armure", description: "", detail: "none" as const },
    { key: "pact-of-the-chain", name: "Chaîne", description: "", detail: "familiar" as const },
    { key: "pact-of-the-blade", name: "Lame", description: "", detail: "weapon" as const },
    { key: "pact-of-the-tome", name: "Grimoire", description: "", detail: "tome" as const },
  ];

  it("exige le sous-choix propre à la manifestation", () => {
    const catalog = aCatalog({ invocations, familiarForms: [{ key: "owl", name: "Hibou" }] });
    const base = { ...EMPTY_COMPOSITION, classKey: "warlock" as const };

    expect(isStepValid("invocation", { catalog, composition: { ...base, invocation: "pact-of-the-chain" } })).toBe(false);
    expect(isStepValid("invocation", { catalog, composition: { ...base, invocation: "pact-of-the-chain", familiarForm: "owl" } })).toBe(true);
    expect(isStepValid("invocation", { catalog, composition: { ...base, invocation: "pact-of-the-tome", invocationSpells: ["a", "b", "c", "d", "e"] } })).toBe(true);
  });

  it("exige six sorts au grimoire et que les préparés y figurent", () => {
    const wizard = aClass({ key: "wizard", spellcasting: {
      ability: "intelligence", cantripsKnown: 3, spellsPrepared: 4, level1Slots: 2, focus: "spellbook",
    } });
    const catalog = aCatalog({ classes: [wizard] });
    const composition = { ...EMPTY_COMPOSITION, classKey: "wizard" as const,
      classSpells: ["a", "b", "c", "d"], spellbook: ["a", "b", "c", "d", "e", "f"] };

    expect(isStepValid("spells", { catalog, composition })).toBe(true);
    expect(isStepValid("spells", { catalog, composition: { ...composition, classSpells: ["a", "b", "c", "x"] } })).toBe(false);
  });

  it("additionne deux Initiés à la magie accordés par des sources distinctes", () => {
    const magicInitiate = {
      key: "magic-initiate" as const, name: "Initié", description: "", repeatable: true,
      spellcastingChoice: { abilityOptions: ["wisdom" as const],
        spellListOptions: ["cleric" as const], cantripsKnown: 2, spellsPrepared: 1 },
      skillOrToolChoiceCount: 0, toolChoiceCount: 0,
    };
    const context = aContext({ speciesKey: "human", speciesFeat: "magic-initiate",
      backgroundKey: "acolyte" });
    context.catalog = aCatalog({ originFeats: [magicInitiate] });

    expect(cantripQuotaOf(context)).toBe(4);
  });
});
