import { describe, expect, it } from "vitest";
import { aCatalog, aSpecies } from "./catalog.fixture";
import { EMPTY_COMPOSITION } from "./character-composition";
import { cantripKeysOf, grantedSpellsOf, hasSpellConflict, spellsTakenElsewhere } from "./chosen-spells";

describe("spellsTakenElsewhere", () => {
  const composition = {
    ...EMPTY_COMPOSITION,
    classCantrips: ["acid-splash", "blade-ward"],
    spellbook: ["shield"],
    magicInitiateChoices: [{
      grantedBy: { type: "background" as const, key: "sage" },
      spellList: "wizard" as const, spellcastingAbility: "intelligence" as const,
      cantrips: ["mage-hand"], spells: ["sleep"],
    }],
  };
  const source = { composition, grantedSpells: ["light"] };

  it("rend indisponibles pour Initié à la magie les sorts pris ailleurs et les octrois", () => {
    const own = composition.magicInitiateChoices[0]!.cantrips;

    expect(spellsTakenElsewhere(source, own)).toEqual(
      ["light", "acid-splash", "blade-ward", "shield", "sleep"],
    );
  });

  it("laisse à un groupe les sorts qu'il a lui-même cochés", () => {
    expect(spellsTakenElsewhere(source, composition.classCantrips)).not.toContain("acid-splash");
  });
});

describe("grantedSpellsOf", () => {
  it("lit les sorts que les traits de l'espèce accordent", () => {
    const aasimar = aSpecies({
      key: "aasimar",
      traits: [{ key: "light-bearer", name: "Porteur de lumière", description: "", grantedSpells: ["light"] }],
    });
    const context = {
      catalog: aCatalog({ species: [aasimar] }),
      composition: { ...EMPTY_COMPOSITION, speciesKey: "aasimar" as const },
    };

    expect(grantedSpellsOf(context)).toEqual(["light"]);
  });
});

describe("hasSpellConflict", () => {
  const aasimar = aSpecies({
    key: "aasimar",
    traits: [{ key: "light-bearer", name: "Porteur de lumière", description: "", grantedSpells: ["light"] }],
  });
  const catalog = aCatalog({ species: [aasimar] });

  it("repère un sort mineur de classe déjà accordé par l'espèce", () => {
    const composition = { ...EMPTY_COMPOSITION, speciesKey: "aasimar" as const, classCantrips: ["light"] };

    expect(hasSpellConflict({ catalog, composition }, cantripKeysOf(composition))).toBe(true);
  });

  it("repère un même sort mineur pris par la classe et par Initié à la magie", () => {
    const composition = {
      ...EMPTY_COMPOSITION,
      classCantrips: ["mage-hand"],
      magicInitiateChoices: [{
        grantedBy: { type: "background" as const, key: "sage" },
        spellList: "wizard" as const, spellcastingAbility: "intelligence" as const,
        cantrips: ["mage-hand"], spells: [],
      }],
    };

    expect(hasSpellConflict({ catalog, composition }, cantripKeysOf(composition))).toBe(true);
  });

  it("laisse passer des sorts distincts", () => {
    const composition = { ...EMPTY_COMPOSITION, classCantrips: ["mage-hand", "light"] };

    expect(hasSpellConflict({ catalog, composition }, cantripKeysOf(composition))).toBe(false);
  });
});
