import { describe, it, expect } from "vitest";
import type { CharacterBuildDetailDto } from "@donjon-dragon/shared";
import { FinalizeCharacterSchema } from "@donjon-dragon/shared";
import { aCatalog, aSpecies } from "./catalog.fixture";
import { toEditPayload } from "./character-payload";
import { toComposition } from "./character-build-detail";

/** Le halfelin du DTO : taille imposée, comme huit espèces sur dix. */
const CATALOG = aCatalog({ species: [aSpecies({
  key: "halfling",
  sizeOptions: ["Small"],
  size: "Small",
  physicalBounds: {
    heightCm: { min: 61, max: 91 },
    weightKg: { min: 17, max: 20 },
    mediumFromHeightCm: null,
  },
})] });

const BASE_DTO: CharacterBuildDetailDto = {
  name: "Frodo Sacquet",
  alignment: "chaoticGood",
  age: 33,
  heightCm: 90,
  weightKg: 18,
  description: null,
  speciesKey: "halfling",
  lineageKey: null,
  size: "Small",
  standardLanguages: ["common", "halfling"],
  lineageSpellcastingAbility: null,
  speciesSkills: [],
  speciesFeat: null,
  classKey: "rogue",
  classSkills: ["acrobatics", "insight", "perception", "stealth"],
  expertise: ["stealth", "perception"],
  classCantrips: [],
  classSpells: [],
  fightingStyle: null,
  classOrder: null,
  weaponMasteries: [],
  classTools: [],
  classLanguage: null,
  invocation: null,
  invocationSpells: [],
  familiarForm: null,
  pactWeaponKey: null,
  spellbook: [],
  backgroundKey: "charlatan",
  backgroundTool: null,
  backgroundBonuses: { dexterity: 2, charisma: 1 },
  featSkills: [],
  featTools: [],
  featToolChoices: {},
  spellcastingAbility: null,
  spellList: null,
  featCantrips: [],
  featSpells: [],
  magicInitiateChoices: [],
  abilityMethod: "standardArray",
  base: { strength: 8, dexterity: 15, constitution: 13, intelligence: 12, wisdom: 10, charisma: 14 },
  abilityRoll: null,
  armorKey: "leather",
  shield: false,
  items: [
    { itemKey: "leather", quantity: 1 },
    { itemKey: "dagger", quantity: 2 },
  ],
  gold: 8,
  classOptionId: "A",
  backgroundOptionId: "A",
  classChoiceItemKey: null,
  backgroundChoiceItemKey: null,
  trinketId: null,
};

describe("toComposition — assignment", () => {
  it("reconstruit les emplacements du tableau standard à partir des scores", () => {
    const composition = toComposition(BASE_DTO, CATALOG);

    expect(composition.assignment).toEqual({
      strength: 5, // 8
      dexterity: 0, // 15
      constitution: 2, // 13
      intelligence: 3, // 12
      wisdom: 4, // 10
      charisma: 1, // 14
    });
  });

  it("désambiguïse des valeurs dupliquées dans le tirage par le premier emplacement libre", () => {
    const dto: CharacterBuildDetailDto = {
      ...BASE_DTO,
      abilityMethod: "roll",
      base: { ...BASE_DTO.base, strength: 9, dexterity: 9 },
      abilityRoll: { dice: [], totals: [9, 9, 13, 12, 10, 14] },
    };

    const composition = toComposition(dto, CATALOG);

    expect(composition.assignment.strength).toBe(0);
    expect(composition.assignment.dexterity).toBe(1);
  });

  it("ne plante pas si la méthode est « roll » sans tirage — cas défensif", () => {
    const dto: CharacterBuildDetailDto = { ...BASE_DTO, abilityMethod: "roll", abilityRoll: null };

    expect(() => toComposition(dto, CATALOG)).not.toThrow();
    expect(toComposition(dto, CATALOG).assignment).toEqual({});
  });

  it("copie les scores directement en achat de points, sans emplacement", () => {
    const dto: CharacterBuildDetailDto = {
      ...BASE_DTO,
      abilityMethod: "pointBuy",
      base: { strength: 15, dexterity: 14, constitution: 13, intelligence: 12, wisdom: 10, charisma: 8 },
    };

    const composition = toComposition(dto, CATALOG);

    expect(composition.assignment).toEqual({});
    expect(composition.pointBuyScores).toEqual(dto.base);
  });
});

describe("toComposition — reste des champs", () => {
  it("recopie les champs granulaires tels quels", () => {
    const composition = toComposition(BASE_DTO, CATALOG);

    expect(composition.name).toBe("Frodo Sacquet");
    expect(composition.speciesKey).toBe("halfling");
    expect(composition.classKey).toBe("rogue");
    expect(composition.classSkills).toEqual(BASE_DTO.classSkills);
    expect(composition.expertise).toEqual(BASE_DTO.expertise);
    expect(composition.backgroundBonuses).toEqual(BASE_DTO.backgroundBonuses);
    expect(composition.armorKey).toBe("leather");
    expect(composition.shield).toBe(false);
  });

  // Le wizard se rouvre sur le choix, pas sur sa conséquence : l'inventaire se
  // recalcule depuis les options au moment d'envoyer.
  it("reprend les options de paquetage retenues", () => {
    const composition = toComposition(BASE_DTO, CATALOG);

    expect(composition.classEquipmentOptionId).toBe("A");
    expect(composition.backgroundEquipmentOptionId).toBe("A");
  });

  it("relit l état civil, figé depuis la création", () => {
    const composition = toComposition(BASE_DTO, CATALOG);

    expect(composition.alignment).toBe("chaoticGood");
    expect(composition.age).toBe(33);
    expect(composition.heightCm).toBe(90);
    expect(composition.weightKg).toBe(18);
    expect(composition.standardLanguages).toEqual(["common", "halfling"]);
  });

  it("ne réintroduit aucun choix explicite de catégorie", () => {
    expect(toComposition(BASE_DTO, CATALOG)).not.toHaveProperty("selectedSize");
  });
});

/**
 * L'aller-retour d'edition. Volontairement `toEditPayload` et non
 * `toCreatePayload` : un personnage tire aux des n'expose plus d'identifiant de
 * tirage consommable, et le contrat de creation le refuserait a juste titre.
 */
describe("aller-retour edition", () => {
  it("restitue au serveur ce qu il en avait recu", () => {
    const payload = toEditPayload(CATALOG, toComposition(BASE_DTO, CATALOG), 0);

    expect(payload).toMatchObject({
      name: BASE_DTO.name,
      alignment: BASE_DTO.alignment,
      age: BASE_DTO.age,
      heightCm: BASE_DTO.heightCm,
      weightKg: BASE_DTO.weightKg,
      standardLanguages: BASE_DTO.standardLanguages,
      abilityRollId: null,
    });
    expect(payload).not.toHaveProperty("size");
  });

  it("produit un corps que le contrat d edition accepte", () => {
    const payload = toEditPayload(CATALOG, toComposition(BASE_DTO, CATALOG), 0);

    expect(FinalizeCharacterSchema.safeParse(payload).success).toBe(true);
  });
});
