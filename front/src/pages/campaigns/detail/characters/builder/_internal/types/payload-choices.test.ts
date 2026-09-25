import { describe, expect, it } from "vitest";
import { EMPTY_COMPOSITION } from "./character-composition";
import { choicesOf } from "./payload-choices";

describe("choix granulaires émis par le wizard", () => {
  it("porte maîtrises, outils et langue sur la source de classe", () => {
    const choices = choicesOf({
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

  it("porte l'outil choisi sur une source d'historique distincte", () => {
    const choices = choicesOf({
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
    const choices = choicesOf({
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
