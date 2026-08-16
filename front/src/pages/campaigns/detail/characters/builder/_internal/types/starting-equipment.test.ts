import { describe, it, expect } from "vitest";
import type {
  CatalogBackground,
  CatalogClass,
  CatalogEquipmentOption,
  DndCatalog,
  Item,
} from "@donjon-dragon/shared";
import { EMPTY_COMPOSITION, type CharacterComposition } from "./character-composition";
import {
  grantedGold,
  grantedItems,
  hasChosenEquipment,
  ownedArmors,
  ownedShield,
} from "./starting-equipment";

function anOption(
  id: string,
  entries: CatalogEquipmentOption["entries"],
  gold: number,
): CatalogEquipmentOption {
  return { id, label: `option ${id}`, entries, gold };
}

function anItem(key: string, name: string, armor: Item["armor"]): Item {
  return {
    key,
    name,
    type: armor ? "armor" : "gear",
    weapon: null,
    armor,
    costInCopper: null,
    weightInKg: null,
    description: null,
    contents: null,
    source: "srd",
    campaignId: null,
  };
}

const CHAIN_MAIL = anItem("chain-mail", "Cotte de mailles", {
  training: "heavy",
  baseArmorClass: 16,
  dexterityAllowance: "none",
  strengthRequirement: 13,
  stealthDisadvantage: true,
});

const SHIELD = anItem("shield", "Bouclier", {
  training: "shields",
  baseArmorClass: 2,
  dexterityAllowance: "none",
  strengthRequirement: null,
  stealthDisadvantage: false,
});

const JAVELIN = anItem("javelin", "Javeline", null);

/** Le catalogue d'objets, celui qui porte desormais les statistiques. */
const ITEMS: Item[] = [CHAIN_MAIL, SHIELD, JAVELIN];

const FIGHTER: CatalogClass = {
  key: "fighter",
  name: "Guerrier",
  primaryAbilities: ["strength"],
  hitDie: 10,
  savingThrows: ["strength", "constitution"],
  skillChoice: { count: 2, options: [] },
  toolProficiencies: [],
  armorTraining: ["light", "medium", "heavy", "shields"],
  weaponProficiencies: ["simple", "martial"],
  startingEquipment: {
    options: [
      anOption("A", [{ itemKey: "chain-mail", quantity: 1 }, { itemKey: "javelin", quantity: 8 }], 4),
      anOption("B", [{ itemKey: "shield", quantity: 1 }], 11),
      anOption("C", [], 155),
    ],
  },
  spellcasting: null,
  level1Features: [],
  expertiseCount: 0,
  level1Choices: [],
};

const SOLDIER: CatalogBackground = {
  key: "soldier",
  name: "Soldat",
  description: "",
  abilityBonuses: ["strength", "dexterity", "constitution"],
  originFeat: "savage-attacker",
  originFeatSpellList: null,
  skillProficiencies: ["athletics", "intimidation"],
  toolProficiency: "",
  equipment: {
    options: [
      anOption("A", [{ itemKey: "javelin", quantity: 2 }, { itemKey: "tente", quantity: 1 }], 14),
      anOption("B", [], 50),
    ],
  },
};

const CATALOG = {
  species: [],
  classes: [FIGHTER],
  backgrounds: [SOLDIER],
  originFeats: [],
  skillLabels: {},
} as unknown as DndCatalog;

function aComposition(overrides: Partial<CharacterComposition> = {}): CharacterComposition {
  return { ...EMPTY_COMPOSITION, classKey: "fighter", backgroundKey: "soldier", ...overrides };
}

const BOTH_CHOSEN = aComposition({
  classEquipmentOptionId: "A",
  backgroundEquipmentOptionId: "A",
});

describe("grantedItems", () => {
  it("ne donne rien tant qu aucune option n est retenue", () => {
    expect(grantedItems(CATALOG, aComposition())).toEqual([]);
  });

  // Le guerrier reçoit 8 javelines, le soldat 2 : c'est une seule ligne à 10.
  it("cumule les quantités d un objet donné par les deux paquetages", () => {
    const javelins = grantedItems(CATALOG, BOTH_CHOSEN).find(
      (item) => item.itemKey === "javelin",
    );

    expect(javelins).toEqual({ itemKey: "javelin", quantity: 10 });
  });

  it("rassemble les objets des deux paquetages", () => {
    const keys = grantedItems(CATALOG, BOTH_CHOSEN).map((item) => item.itemKey);

    expect(keys.sort()).toEqual(["chain-mail", "javelin", "tente"]);
  });

  it("ne donne aucun objet quand l option est tout en or", () => {
    const goldOnly = aComposition({
      classEquipmentOptionId: "C",
      backgroundEquipmentOptionId: "B",
    });

    expect(grantedItems(CATALOG, goldOnly)).toEqual([]);
  });
});

describe("grantedGold", () => {
  it("additionne l or des deux options", () => {
    expect(grantedGold(CATALOG, BOTH_CHOSEN)).toBe(18);
  });

  it("rend l or plein quand les deux options y renoncent", () => {
    const goldOnly = aComposition({
      classEquipmentOptionId: "C",
      backgroundEquipmentOptionId: "B",
    });

    expect(grantedGold(CATALOG, goldOnly)).toBe(205);
  });
});

describe("ce que le personnage peut porter", () => {
  const grantedFor = (composition: CharacterComposition) => grantedItems(CATALOG, composition);

  it("ne propose que les armures que le paquetage a données", () => {
    const wearable = ownedArmors(ITEMS, grantedFor(BOTH_CHOSEN));

    expect(wearable.map((armor) => armor.key)).toEqual(["chain-mail"]);
  });

  // La règle qui manquait : un guerrier ne choisit pas une armure dans une
  // vitrine, il porte ce que son option lui a donné.
  it("ne propose aucune armure quand l option est tout en or", () => {
    const goldOnly = aComposition({ classEquipmentOptionId: "C" });

    expect(ownedArmors(ITEMS, grantedFor(goldOnly))).toEqual([]);
  });

  // La javeline est possédée mais n'est pas une armure : elle ne se porte pas.
  it("ne propose pas un objet possédé qui n est pas une armure", () => {
    const keys = ownedArmors(ITEMS, grantedFor(BOTH_CHOSEN)).map((armor) => armor.key);

    expect(keys).not.toContain("javelin");
  });

  it("ne propose le bouclier que si le paquetage en contient un", () => {
    expect(ownedShield(ITEMS, grantedFor(BOTH_CHOSEN))).toBeNull();
    expect(ownedShield(ITEMS, grantedFor(aComposition({ classEquipmentOptionId: "B" })))).toEqual(
      SHIELD,
    );
  });
});

describe("hasChosenEquipment", () => {
  it("exige les deux paquetages", () => {
    expect(hasChosenEquipment(CATALOG, aComposition())).toBe(false);
    expect(hasChosenEquipment(CATALOG, aComposition({ classEquipmentOptionId: "A" }))).toBe(false);
    expect(hasChosenEquipment(CATALOG, BOTH_CHOSEN)).toBe(true);
  });
});
