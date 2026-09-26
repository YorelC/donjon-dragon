import { describe, expect, it } from "vitest";
import { aBackground, aCatalog, aClass } from "./catalog.fixture";
import { EMPTY_COMPOSITION } from "./character-composition";
import { toolsKnownBesides } from "./known-tools";

describe("toolsKnownBesides", () => {
  const catalog = aCatalog({
    classes: [aClass({ key: "rogue", toolProficiencies: ["thieves-tools"] })],
    backgrounds: [aBackground({ key: "farmer", fixedTool: "carpenters-tools" })],
  });

  it("réunit outils d'office et outils choisis par les autres sources", () => {
    const composition = {
      ...EMPTY_COMPOSITION, classKey: "rogue" as const, backgroundKey: "farmer" as const,
      featTools: ["dice-set"], featToolChoices: { crafter: ["smiths-tools"] },
    };

    expect(toolsKnownBesides({ catalog, composition }, [])).toEqual(
      ["thieves-tools", "carpenters-tools", "dice-set", "smiths-tools"],
    );
  });

  it("laisse au choix en cours les outils qu'il a lui-même pris", () => {
    const composition = { ...EMPTY_COMPOSITION, featToolChoices: { crafter: ["smiths-tools"] } };

    expect(toolsKnownBesides({ catalog, composition }, ["smiths-tools"])).toEqual([]);
  });
});
