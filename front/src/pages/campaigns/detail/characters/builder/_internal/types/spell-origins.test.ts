import { describe, expect, it } from "vitest";
import { aCatalog, aSpecies } from "./catalog.fixture";
import { EMPTY_COMPOSITION, type MagicInitiateSelection } from "./character-composition";
import { spellGrantsOf } from "./chosen-spells";
import { magicInitiateGroupOf, spellOriginsOf } from "./spell-origins";

const BACKGROUND_INITIATE: MagicInitiateSelection = {
  grantedBy: { type: "background", key: "acolyte" },
  spellList: "cleric", spellcastingAbility: "wisdom",
  cantrips: ["light"], spells: [],
};

const COMPOSITION = {
  ...EMPTY_COMPOSITION,
  classCantrips: ["light", "guidance"],
  magicInitiateChoices: [BACKGROUND_INITIATE],
};

describe("source d'un sort indisponible", () => {
  it("nomme ce qui accorde le sort", () => {
    const source = { composition: COMPOSITION, grantedSpells: ["mending"], grantedBy: [{ label: "Gnome des roches", keys: ["mending"] }] };

    expect(spellOriginsOf(source, { group: "classCantrips", keys: COMPOSITION.classCantrips }).mending)
      .toEqual({ kind: "granted", label: "Gnome des roches" });
  });

  // Chaque groupe voit l'autre : jamais lui-même comme la cause.
  it("nomme l'autre groupe qui a pris le sort, jamais le sien", () => {
    const source = { composition: COMPOSITION, grantedSpells: [], grantedBy: [] };
    const fromClass = spellOriginsOf(source, { group: "classCantrips", keys: COMPOSITION.classCantrips });
    const fromInitiate = spellOriginsOf(source, {
      group: magicInitiateGroupOf(BACKGROUND_INITIATE, "cantrips"), keys: BACKGROUND_INITIATE.cantrips,
    });

    expect(fromClass.light).toEqual({ kind: "chosen", label: "Sorts mineurs — Historique" });
    expect(fromInitiate.light).toEqual({ kind: "chosen", label: "Sorts mineurs de classe" });
  });

  it("range les octrois sous le nom de l'espèce qui les accorde", () => {
    const gnome = aSpecies({
      key: "gnome", name: "Gnome",
      traits: [{ key: "t", name: "Trait", description: "", grantedSpells: ["mending"] }],
    });
    const context = { catalog: aCatalog({ species: [gnome] }), composition: { ...EMPTY_COMPOSITION, speciesKey: "gnome" as const } };

    expect(spellGrantsOf(context)).toEqual([{ label: "Gnome", keys: ["mending"] }]);
  });
});
