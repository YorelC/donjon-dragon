import { describe, it, expect } from "vitest";
import type { CharacterBuildDetailDto } from "@donjon-dragon/shared";
import { toComposition } from "./character-build-detail";

const BASE_DTO: CharacterBuildDetailDto = {
  name: "Frodo Sacquet",
  speciesKey: "halfling",
  lineageKey: null,
  speciesSkills: [],
  speciesFeat: null,
  classKey: "rogue",
  classSkills: ["acrobatics", "insight", "perception", "stealth"],
  expertise: ["stealth", "perception"],
  classCantrips: [],
  classSpells: [],
  fightingStyle: null,
  classOrder: null,
  backgroundKey: "charlatan",
  backgroundBonuses: { dexterity: 2, charisma: 1 },
  featSkills: [],
  featTools: [],
  spellcastingAbility: null,
  spellList: null,
  featCantrips: [],
  featSpells: [],
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
};

describe("toComposition — assignment", () => {
  it("reconstruit les emplacements du tableau standard à partir des scores", () => {
    const composition = toComposition(BASE_DTO);

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

    const composition = toComposition(dto);

    expect(composition.assignment.strength).toBe(0);
    expect(composition.assignment.dexterity).toBe(1);
  });

  it("ne plante pas si la méthode est « roll » sans tirage — cas défensif", () => {
    const dto: CharacterBuildDetailDto = { ...BASE_DTO, abilityMethod: "roll", abilityRoll: null };

    expect(() => toComposition(dto)).not.toThrow();
    expect(toComposition(dto).assignment).toEqual({});
  });

  it("copie les scores directement en achat de points, sans emplacement", () => {
    const dto: CharacterBuildDetailDto = {
      ...BASE_DTO,
      abilityMethod: "pointBuy",
      base: { strength: 15, dexterity: 14, constitution: 13, intelligence: 12, wisdom: 10, charisma: 8 },
    };

    const composition = toComposition(dto);

    expect(composition.assignment).toEqual({});
    expect(composition.pointBuyScores).toEqual(dto.base);
  });
});

describe("toComposition — reste des champs", () => {
  it("recopie les champs granulaires tels quels", () => {
    const composition = toComposition(BASE_DTO);

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
    const composition = toComposition(BASE_DTO);

    expect(composition.classEquipmentOptionId).toBe("A");
    expect(composition.backgroundEquipmentOptionId).toBe("A");
  });
});
