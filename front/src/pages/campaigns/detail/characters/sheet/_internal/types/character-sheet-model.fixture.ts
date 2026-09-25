import {
  SkillNameSchema,
  type Ability,
  type ComputedCharacter,
  type ResolvedSavingThrow,
  type ResolvedSkill,
} from "@donjon-dragon/shared";
import type { CharacterSheetModel } from "./character-sheet-model";

const PROFICIENT_SAVES: readonly Ability[] = ["dexterity", "wisdom"];
const PROFICIENT_SKILLS = ["stealth", "survival"];

/** Un modèle de fiche construit au type réel — sans cast, pour que `tsc` casse au contrat. */
export function aSheetModel(overrides: Partial<ComputedCharacter> = {}): CharacterSheetModel {
  return {
    sheet: { ...aSheet(), ...overrides },
    identity: {
      name: "Vaelira", alignment: "neutralGood", age: 118, heightCm: 172, weightKg: 54,
      description: "Silhouette fine et nerveuse des elfes des bois.",
    },
    labels: {
      skills: { stealth: "Discrétion", survival: "Survie" },
      tools: {}, languages: { common: "Commun", elvish: "Elfique" },
      alignment: "Neutre bon", backgroundDescription: "Vagabonde depuis l'adolescence.",
    },
  };
}

function aSheet(): ComputedCharacter {
  return {
    ...anIdentityCore(),
    ...someDerivedValues(),
    savingThrows: {
      strength: aSave("strength"), dexterity: aSave("dexterity"),
      constitution: aSave("constitution"), intelligence: aSave("intelligence"),
      wisdom: aSave("wisdom"), charisma: aSave("charisma"),
    },
    skills: SkillNameSchema.options.map(aSkill),
    proficiencies: {
      skills: ["stealth", "survival"], expertise: [], tools: [], languages: ["common", "elvish"],
      armorTraining: ["light", "medium", "shields"], weapons: ["simple", "martial"],
      savingThrows: ["dexterity", "wisdom"],
    },
    spellcasting: [], features: [], resources: [], attacks: [], spellbook: [],
  };
}

function anIdentityCore() {
  return {
    equipment: {
      items: [{ itemKey: "rope", name: "Corde en chanvre", quantity: 1 }], gold: 12,
      armorName: "Armure de cuir", shield: false, stealthDisadvantage: false,
    },
    level: 1, experiencePoints: 0, proficiencyBonus: 2, hitDie: 10,
    speciesName: "Elfe", lineageName: "Elfe des bois", className: "Rôdeur",
    backgroundName: "Vagabond", size: "Medium" as const, darkvision: 18,
    abilityMethod: "standardArray" as const,
  };
}

function someDerivedValues() {
  const ability = { score: 12, modifier: 1 };
  return {
    abilities: {
      strength: ability, dexterity: ability, constitution: ability,
      intelligence: ability, wisdom: ability, charisma: ability,
    },
    maxHitPoints: { value: 12, sources: [] }, currentHitPoints: { value: 12, sources: [] },
    armorClass: { value: 14, sources: [] }, initiative: { value: 3, sources: [] },
    speed: { value: 10.5, sources: [] }, passivePerception: 13, unarmedDamage: "1",
  };
}

function aSave(ability: Ability): ResolvedSavingThrow {
  return { ability, modifier: 1, proficient: PROFICIENT_SAVES.includes(ability) };
}

function aSkill(skill: ResolvedSkill["skill"]): ResolvedSkill {
  const proficient = PROFICIENT_SKILLS.includes(skill);
  return { skill, ability: "dexterity", modifier: proficient ? 5 : 1, proficient, expert: false };
}
