import { describe, expect, it } from "vitest";
import { EMPTY_COMPOSITION } from "./character-composition";
import { aBackground, aCatalog } from "./catalog.fixture";
import { choicesOf } from "./payload-choices";

const CATALOG = aCatalog({
  backgrounds: [aBackground(), aBackground({ key: "artisan", originFeat: "crafter" })],
});

describe("choix granulaires émis par le wizard", () => {
  it("porte maîtrises, outils et langue sur la source de classe", () => {
    const choices = choicesOf(CATALOG, {
      ...EMPTY_COMPOSITION,
      classKey: "rogue",
      weaponMasteries: ["dagger", "shortbow"],
      classTools: ["thieves-tools"],
      classLanguage: "abyssal",
    });
    const classChoice = choices.find((choice) => choice.source.type === "class");

    expect(classChoice).toMatchObject({
      weaponMasteries: ["dagger", "shortbow"],
      tools: ["thieves-tools"],
      languages: ["abyssal"],
    });
  });

  it("porte les outils de Façonneur et de Musicien chacun sur la source de son don", () => {
    const choices = choicesOf(CATALOG, {
      ...EMPTY_COMPOSITION,
      backgroundKey: "artisan",
      featToolChoices: { crafter: ["smiths-tools", "woodcarvers-tools", "potters-tools"], musician: [] },
    });

    expect(choices).toContainEqual({
      source: { type: "feat", key: "crafter" },
      tools: ["smiths-tools", "woodcarvers-tools", "potters-tools"],
    });
    expect(choices.some((choice) => choice.source.key === "musician")).toBe(false);
  });

  it("n'émet pas les outils d'un don qui n'est plus accordé", () => {
    const choices = choicesOf(CATALOG, {
      ...EMPTY_COMPOSITION,
      backgroundKey: "acolyte",
      featToolChoices: { crafter: ["smiths-tools", "woodcarvers-tools", "potters-tools"] },
    });

    expect(choices.some((choice) => choice.source.key === "crafter")).toBe(false);
  });

  it("porte l'outil choisi sur une source d'historique distincte", () => {
    const choices = choicesOf(CATALOG, {
      ...EMPTY_COMPOSITION,
      backgroundKey: "artisan",
      backgroundTool: "smiths-tools",
    });

    expect(choices).toContainEqual({
      source: { type: "background", key: "artisan" },
      tools: ["smiths-tools"],
    });
  });

  it("conserve deux Initiés à la magie avec leurs provenances", () => {
    const choices = choicesOf(CATALOG, {
      ...EMPTY_COMPOSITION,
      magicInitiateChoices: [
        { grantedBy: { type: "background", key: "acolyte" }, spellList: "cleric",
          spellcastingAbility: "wisdom", cantrips: ["guidance", "light"], spells: ["bless"] },
        { grantedBy: { type: "species", key: "human" }, spellList: "wizard",
          spellcastingAbility: "intelligence", cantrips: ["mage-hand", "light"], spells: ["sleep"] },
      ],
    });
    const magic = choices.filter((choice) => choice.source.key === "magic-initiate");

    expect(magic).toHaveLength(2);
    expect(magic.map((choice) => choice.source.grantedBy)).toEqual([
      { type: "background", key: "acolyte" }, { type: "species", key: "human" },
    ]);
  });
});
