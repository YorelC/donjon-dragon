import { describe, expect, it } from "vitest";
import type { CatalogOriginFeat } from "@donjon-dragon/shared";
import { aBackground, aCatalog, aClass } from "./catalog.fixture";
import { backgroundChangePatch, classChangePatch } from "./builder-transitions";
import { EMPTY_COMPOSITION, type CharacterComposition } from "./character-composition";

const MAGIC_INITIATE: CatalogOriginFeat = {
  key: "magic-initiate",
  name: "Initié à la magie",
  description: "",
  repeatable: true,
  spellcastingChoice: {
    abilityOptions: ["intelligence", "wisdom", "charisma"],
    spellListOptions: ["cleric", "druid", "wizard"],
    cantripsKnown: 2,
    spellsPrepared: 1,
  },
  skillOrToolChoiceCount: 0,
  toolChoiceCount: 0,
};

function configured(overrides: Partial<CharacterComposition> = {}): CharacterComposition {
  return {
    ...EMPTY_COMPOSITION,
    classKey: "cleric",
    backgroundKey: "acolyte",
    ...overrides,
  };
}

describe("transition de classe", () => {
  it("ne change rien quand la classe reste la même", () => {
    const context = { catalog: aCatalog(), composition: configured() };

    expect(classChangePatch("cleric", context)).toEqual({});
  });

  it("efface les choix de classe et conserve le bouclier encore possédé", () => {
    const background = aBackground({
      equipment: {
        options: [{
          id: "A", label: "A", entries: [{ itemKey: "shield", quantity: 1 }],
          gold: 0, itemChoice: null,
        }],
      },
    });
    const composition = configured({
      classSkills: ["history"], expertise: ["history"], classOrder: "protector",
      weaponMasteries: ["mace"], classTools: ["drum"], classLanguage: "celestial",
      classEquipmentOptionId: "A", backgroundEquipmentOptionId: "A",
      armorKey: "chain-shirt", shield: true,
    });

    const patch = classChangePatch("druid", {
      catalog: aCatalog({ classes: [aClass(), aClass({ key: "druid" })], backgrounds: [background] }),
      composition,
    });

    expect(patch).toMatchObject({
      classKey: "druid", classSkills: [], expertise: [], classOrder: null,
      weaponMasteries: [], classTools: [], classLanguage: null,
      classEquipmentOptionId: null, armorKey: null, shield: true,
    });
  });
});

describe("transition d'historique", () => {
  it("retire un doublon de classe mais garde son expertise encore maîtrisée", () => {
    const guide = aBackground({
      key: "guide", name: "Guide", originFeatSpellList: "druid",
      skillProficiencies: ["history", "survival"],
    });
    const composition = configured({
      classSkills: ["history", "insight"], expertise: ["history", "insight"],
    });

    const patch = backgroundChangePatch("guide", {
      catalog: aCatalog({ backgrounds: [aBackground(), guide], originFeats: [MAGIC_INITIATE] }),
      composition,
    });

    expect(patch.classSkills).toEqual(["insight"]);
    expect(patch.expertise).toEqual(["history", "insight"]);
  });

  it("réinitialise Initié à la magie quand sa liste imposée change", () => {
    const acolyte = aBackground({ originFeatSpellList: "cleric" });
    const guide = aBackground({ key: "guide", originFeatSpellList: "druid" });
    const composition = configured({
      spellList: "cleric", spellcastingAbility: "wisdom",
      featCantrips: ["guidance", "light"], featSpells: ["bless"],
    });

    const patch = backgroundChangePatch("guide", {
      catalog: aCatalog({ backgrounds: [acolyte, guide], originFeats: [MAGIC_INITIATE] }),
      composition,
    });

    expect(patch).toMatchObject({
      spellList: null, spellcastingAbility: null, featCantrips: [], featSpells: [],
    });
  });

  it("préserve l’occurrence d’espèce quand l’historique change", () => {
    const acolyte = aBackground({ originFeatSpellList: "cleric" });
    const guide = aBackground({ key: "guide", originFeatSpellList: "druid" });
    const speciesChoice = {
      grantedBy: { type: "species" as const, key: "human" },
      spellList: "wizard" as const, spellcastingAbility: "intelligence" as const,
      cantrips: ["light", "mage-hand"], spells: ["sleep"],
    };
    const composition = configured({ magicInitiateChoices: [speciesChoice] });

    const patch = backgroundChangePatch("guide", {
      catalog: aCatalog({ backgrounds: [acolyte, guide], originFeats: [MAGIC_INITIATE] }),
      composition,
    });

    expect(patch.magicInitiateChoices).toEqual([speciesChoice, {
      grantedBy: { type: "background", key: "guide" },
      spellList: "druid", spellcastingAbility: null, cantrips: [], spells: [],
    }]);
  });

  it("retire une expertise devenue orpheline avec les choix du don", () => {
    const acolyte = aBackground({ originFeatSpellList: "cleric" });
    const guide = aBackground({ key: "guide", originFeatSpellList: "druid" });
    const composition = configured({ featSkills: ["medicine"], expertise: ["medicine"] });

    const patch = backgroundChangePatch("guide", {
      catalog: aCatalog({ backgrounds: [acolyte, guide], originFeats: [MAGIC_INITIATE] }),
      composition,
    });

    expect(patch).toMatchObject({ featSkills: [], expertise: [] });
  });

  it("retient d'office la liste que l'historique impose à Initié à la magie", () => {
    const sage = aBackground({
      key: "sage", originFeat: "magic-initiate", originFeatSpellList: "wizard",
    });
    const context = {
      catalog: aCatalog({ backgrounds: [sage], originFeats: [MAGIC_INITIATE] }),
      composition: configured({ backgroundKey: null }),
    };

    expect(backgroundChangePatch("sage", context).magicInitiateChoices).toEqual([{
      grantedBy: { type: "background", key: "sage" },
      spellList: "wizard", spellcastingAbility: null, cantrips: [], spells: [],
    }]);
  });
});
